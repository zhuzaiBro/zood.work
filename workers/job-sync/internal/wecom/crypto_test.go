package wecom

import (
	"crypto/rand"
	"encoding/base64"
	"strings"
	"testing"
)

func TestEncryptDecryptMessage(t *testing.T) {
	cfg := Config{
		CorpID:         "ww1234567890",
		Token:          "token123",
		EncodingAESKey: randomEncodingAESKey(t),
	}
	plainXML := []byte(`<xml><ToUserName><![CDATA[ww1234567890]]></ToUserName><FromUserName><![CDATA[user1]]></FromUserName><CreateTime>123</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[岗位 Rust 远程]]></Content></xml>`)

	encrypted, err := EncryptMessage(plainXML, cfg)
	if err != nil {
		t.Fatalf("EncryptMessage() error = %v", err)
	}
	signature := Sign(cfg.Token, "111", "nonce", encrypted)
	if !VerifySignature(cfg.Token, signature, "111", "nonce", encrypted) {
		t.Fatal("VerifySignature() = false")
	}

	decrypted, err := DecryptMessage(encrypted, cfg)
	if err != nil {
		t.Fatalf("DecryptMessage() error = %v", err)
	}
	if string(decrypted) != string(plainXML) {
		t.Fatalf("decrypted mismatch\nwant: %s\n got: %s", plainXML, decrypted)
	}

	message, err := ParsePlainMessage(decrypted)
	if err != nil {
		t.Fatalf("ParsePlainMessage() error = %v", err)
	}
	if message.Content != "岗位 Rust 远程" {
		t.Fatalf("message.Content = %q", message.Content)
	}

	replyXML, err := BuildTextReply(message, "ok")
	if err != nil {
		t.Fatalf("BuildTextReply() error = %v", err)
	}
	encryptedReply, err := BuildEncryptedReply(replyXML, cfg, "nonce")
	if err != nil {
		t.Fatalf("BuildEncryptedReply() error = %v", err)
	}
	if !strings.Contains(string(encryptedReply), "<Encrypt>") {
		t.Fatalf("encrypted reply missing Encrypt: %s", encryptedReply)
	}
}

func TestBuildTextReplyForBotMessage(t *testing.T) {
	message := PlainMessage{
		MsgType: "text",
		ChatID:  "chat123",
	}
	message.Text.Content = "岗位 前端"

	reply, err := BuildTextReply(message, "ok")
	if err != nil {
		t.Fatalf("BuildTextReply() error = %v", err)
	}

	replyText := string(reply)
	if !strings.Contains(replyText, "<MsgType><![CDATA[text]]></MsgType>") {
		t.Fatalf("reply missing MsgType: %s", replyText)
	}
	if !strings.Contains(replyText, "<Text><Content><![CDATA[ok]]></Content></Text>") {
		t.Fatalf("reply missing bot text payload: %s", replyText)
	}
	if strings.Contains(replyText, "ToUserName") {
		t.Fatalf("bot reply should not contain ToUserName: %s", replyText)
	}
}

func randomEncodingAESKey(t *testing.T) string {
	t.Helper()
	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		t.Fatal(err)
	}
	return base64.StdEncoding.EncodeToString(key)[:43]
}
