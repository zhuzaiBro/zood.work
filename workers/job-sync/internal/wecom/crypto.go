package wecom

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base64"
	"encoding/binary"
	"encoding/hex"
	"encoding/xml"
	"fmt"
	"io"
	"sort"
	"strings"
	"time"
)

const aesBlockSize = 32

type Config struct {
	CorpID         string
	Token          string
	EncodingAESKey string
}

type encryptedXML struct {
	XMLName      xml.Name `xml:"xml"`
	Encrypt      string   `xml:"Encrypt"`
	MsgSignature string   `xml:"MsgSignature,omitempty"`
	TimeStamp    string   `xml:"TimeStamp,omitempty"`
	Nonce        string   `xml:"Nonce,omitempty"`
}

type PlainMessage struct {
	XMLName      xml.Name `xml:"xml"`
	ToUserName   string   `xml:"ToUserName"`
	FromUserName string   `xml:"FromUserName"`
	CreateTime   int64    `xml:"CreateTime"`
	MsgType      string   `xml:"MsgType"`
	Content      string   `xml:"Content"`
	Event        string   `xml:"Event"`
	ChatType     string   `xml:"ChatType"`
	ChatID       string   `xml:"ChatId"`
	WebhookURL   string   `xml:"WebhookUrl"`
	Text         struct {
		Content string `xml:"Content"`
	} `xml:"Text"`
	From struct {
		Alias  string `xml:"Alias"`
		Name   string `xml:"Name"`
		UserID string `xml:"UserId"`
	} `xml:"From"`
}

type textReplyXML struct {
	XMLName      xml.Name `xml:"xml"`
	ToUserName   cdata    `xml:"ToUserName"`
	FromUserName cdata    `xml:"FromUserName"`
	CreateTime   int64    `xml:"CreateTime"`
	MsgType      cdata    `xml:"MsgType"`
	Content      cdata    `xml:"Content"`
}

type botTextReplyXML struct {
	XMLName xml.Name    `xml:"xml"`
	MsgType cdata       `xml:"MsgType"`
	Text    textPayload `xml:"Text"`
}

type textPayload struct {
	Content cdata `xml:"Content"`
}

type cdata string

func (c cdata) MarshalXML(e *xml.Encoder, start xml.StartElement) error {
	if err := e.EncodeToken(start); err != nil {
		return err
	}
	if err := e.EncodeToken(xml.Directive("[CDATA[" + strings.ReplaceAll(string(c), "]]>", "]]]]><![CDATA[>") + "]]")); err != nil {
		return err
	}
	return e.EncodeToken(start.End())
}

func VerifySignature(token, signature, timestamp, nonce, encrypted string) bool {
	return signature == Sign(token, timestamp, nonce, encrypted)
}

func Sign(values ...string) string {
	sort.Strings(values)
	hash := sha1.Sum([]byte(strings.Join(values, "")))
	return hex.EncodeToString(hash[:])
}

func ParseEncryptedXML(payload []byte) (string, error) {
	var body encryptedXML
	if err := xml.Unmarshal(payload, &body); err != nil {
		return "", err
	}
	if body.Encrypt == "" {
		return "", fmt.Errorf("missing Encrypt")
	}
	return body.Encrypt, nil
}

func DecryptMessage(encrypted string, cfg Config) ([]byte, error) {
	key, err := aesKey(cfg.EncodingAESKey)
	if err != nil {
		return nil, err
	}

	cipherText, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil {
		return nil, err
	}
	if len(cipherText)%aes.BlockSize != 0 {
		return nil, fmt.Errorf("invalid cipher text length")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	plain := make([]byte, len(cipherText))
	cipher.NewCBCDecrypter(block, key[:aes.BlockSize]).CryptBlocks(plain, cipherText)

	plain, err = pkcs7Unpad(plain)
	if err != nil {
		return nil, err
	}
	if len(plain) < 20 {
		return nil, fmt.Errorf("invalid plain message")
	}

	messageLength := int(binary.BigEndian.Uint32(plain[16:20]))
	xmlStart := 20
	xmlEnd := xmlStart + messageLength
	if xmlEnd > len(plain) {
		return nil, fmt.Errorf("invalid xml length")
	}

	corpID := string(plain[xmlEnd:])
	if corpID != cfg.CorpID {
		return nil, fmt.Errorf("corp id mismatch")
	}
	return plain[xmlStart:xmlEnd], nil
}

func EncryptMessage(plainXML []byte, cfg Config) (string, error) {
	key, err := aesKey(cfg.EncodingAESKey)
	if err != nil {
		return "", err
	}

	random := make([]byte, 16)
	if _, err := io.ReadFull(rand.Reader, random); err != nil {
		return "", err
	}

	length := make([]byte, 4)
	binary.BigEndian.PutUint32(length, uint32(len(plainXML)))
	plain := bytes.Join([][]byte{
		random,
		length,
		plainXML,
		[]byte(cfg.CorpID),
	}, nil)
	plain = pkcs7Pad(plain)

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	cipherText := make([]byte, len(plain))
	cipher.NewCBCEncrypter(block, key[:aes.BlockSize]).CryptBlocks(cipherText, plain)
	return base64.StdEncoding.EncodeToString(cipherText), nil
}

func ParsePlainMessage(plainXML []byte) (PlainMessage, error) {
	var message PlainMessage
	err := xml.Unmarshal(plainXML, &message)
	return message, err
}

func BuildTextReply(message PlainMessage, content string) ([]byte, error) {
	if message.IsBotMessage() {
		return xml.Marshal(botTextReplyXML{
			MsgType: cdata("text"),
			Text: textPayload{
				Content: cdata(content),
			},
		})
	}

	return xml.Marshal(textReplyXML{
		ToUserName:   cdata(message.FromUserName),
		FromUserName: cdata(message.ToUserName),
		CreateTime:   time.Now().Unix(),
		MsgType:      cdata("text"),
		Content:      cdata(content),
	})
}

func (m PlainMessage) IsBotMessage() bool {
	return m.ChatID != "" || m.WebhookURL != "" || m.Text.Content != ""
}

func (m PlainMessage) TextContent() string {
	if m.Text.Content != "" {
		return m.Text.Content
	}
	return m.Content
}

func BuildEncryptedReply(plainXML []byte, cfg Config, nonce string) ([]byte, error) {
	encrypted, err := EncryptMessage(plainXML, cfg)
	if err != nil {
		return nil, err
	}
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	signature := Sign(cfg.Token, timestamp, nonce, encrypted)

	return xml.Marshal(encryptedXML{
		Encrypt:      encrypted,
		MsgSignature: signature,
		TimeStamp:    timestamp,
		Nonce:        nonce,
	})
}

func aesKey(encodingAESKey string) ([]byte, error) {
	if len(encodingAESKey) != 43 {
		return nil, fmt.Errorf("encoding aes key must be 43 chars")
	}
	return base64.StdEncoding.DecodeString(encodingAESKey + "=")
}

func pkcs7Pad(buffer []byte) []byte {
	padding := aesBlockSize - len(buffer)%aesBlockSize
	if padding == 0 {
		padding = aesBlockSize
	}
	return append(buffer, bytes.Repeat([]byte{byte(padding)}, padding)...)
}

func pkcs7Unpad(buffer []byte) ([]byte, error) {
	if len(buffer) == 0 {
		return nil, fmt.Errorf("empty padding")
	}
	padding := int(buffer[len(buffer)-1])
	if padding < 1 || padding > aesBlockSize || padding > len(buffer) {
		return nil, fmt.Errorf("invalid padding")
	}
	return buffer[:len(buffer)-padding], nil
}
