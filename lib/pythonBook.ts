export const PYTHON_BOOK_COURSE_ID = '2afaa677-1f07-4d36-9b25-129a5fd346f1'

export interface PythonBookSection {
  id: string
  title: string
  summary: string
  markdown: string
}

export const pythonBookSections: PythonBookSection[] = [
  {
    id: 'python-intro',
    title: '01. 第一个 Python 程序',
    summary: '先建立对 Python 执行方式、缩进规则和 print 输出的直觉。',
    markdown: `
## 为什么从 Python 开始

Python 的语法非常接近自然语言，适合先建立编程思维，再过渡到工程化项目。

### 第一个脚本

\`\`\`python
print("Hello, Python!")
print("Welcome to zood.work")
\`\`\`

### 这段代码做了什么

- \`print()\` 会把内容输出到终端
- 字符串通常写在引号里
- Python 运行脚本时会从上到下逐行执行

### 一个好习惯

从第一节开始就给文件起清晰的名字，例如：

\`\`\`text
hello.py
variables_demo.py
loop_practice.py
\`\`\`
`,
  },
  {
    id: 'python-variables',
    title: '02. 变量与基本类型',
    summary: '理解变量命名、字符串、数字和布尔值，是后续一切逻辑的起点。',
    markdown: `
## 变量

变量就是给一段数据起名字，后面可以重复使用。

\`\`\`python
name = "zood"
age = 18
score = 99.5
is_admin = True
\`\`\`

### 常见基础类型

- \`str\`：字符串
- \`int\`：整数
- \`float\`：浮点数
- \`bool\`：布尔值

### 查看类型

\`\`\`python
name = "python book"
price = 19.9

print(type(name))
print(type(price))
\`\`\`

### 命名建议

- 使用蛇形命名法：\`user_name\`
- 不要使用拼音缩写和无意义变量名
- 变量名尽量体现业务含义
`,
  },
  {
    id: 'python-condition-loop',
    title: '03. 条件判断与循环',
    summary: '会写 if 和 for，才真正开始进入程序控制流程。',
    markdown: `
## 条件判断

\`\`\`python
score = 87

if score >= 90:
    print("优秀")
elif score >= 60:
    print("及格")
else:
    print("继续努力")
\`\`\`

注意：Python 用缩进表示代码块，不是用大括号。

## for 循环

\`\`\`python
topics = ["变量", "条件", "循环"]

for topic in topics:
    print("正在学习:", topic)
\`\`\`

## while 循环

\`\`\`python
count = 1

while count <= 3:
    print("第", count, "次练习")
    count += 1
\`\`\`

### 什么时候用它们

- 条件判断：控制分支逻辑
- for：遍历一个可迭代对象
- while：满足条件时持续执行
`,
  },
  {
    id: 'python-function',
    title: '04. 函数与参数',
    summary: '把重复逻辑封装成函数，代码才会越来越像工程代码。',
    markdown: `
## 定义函数

\`\`\`python
def greet(name):
    print(f"你好，{name}")

greet("Alice")
greet("Bob")
\`\`\`

## 返回值

\`\`\`python
def add(a, b):
    return a + b

result = add(3, 5)
print(result)
\`\`\`

## 默认参数

\`\`\`python
def create_user(name, role="student"):
    return {"name": name, "role": role}

print(create_user("zood"))
print(create_user("tom", role="admin"))
\`\`\`

### 实战建议

一个函数最好只做一件事，名字直接描述动作，例如：

- \`fetch_course_list\`
- \`format_duration\`
- \`save_progress\`
`,
  },
  {
    id: 'python-collections',
    title: '05. 列表、字典与数据组织',
    summary: '真实业务代码里，大多数数据都要装进 list 和 dict。',
    markdown: `
## 列表 list

\`\`\`python
lessons = ["变量", "函数", "字典"]

print(lessons[0])
lessons.append("文件操作")
print(len(lessons))
\`\`\`

## 字典 dict

\`\`\`python
user = {
    "name": "zood",
    "role": "teacher",
    "vip_level": 3
}

print(user["name"])
print(user.get("email", "未填写"))
\`\`\`

## 列表里放字典

\`\`\`python
courses = [
    {"title": "Python 入门", "free": True},
    {"title": "Web3 后端", "free": False},
]

for course in courses:
    print(course["title"], course["free"])
\`\`\`

### 为什么这个结构很重要

因为接口返回、数据库结果、JSON 数据，很多时候本质都是这类嵌套结构。
`,
  },
  {
    id: 'python-modules',
    title: '06. 文件、模块与小项目思维',
    summary: '最后一步是从“写脚本”迈向“组织项目”。',
    markdown: `
## 读写文件

\`\`\`python
with open("notes.txt", "w", encoding="utf-8") as file:
    file.write("Python 学习记录\\n")
    file.write("今天完成了函数和字典")
\`\`\`

\`\`\`python
with open("notes.txt", "r", encoding="utf-8") as file:
    content = file.read()
    print(content)
\`\`\`

## 模块导入

假设你有一个 \`utils.py\`：

\`\`\`python
def format_price(price):
    return f"¥{price:.2f}"
\`\`\`

另一个文件里可以这样用：

\`\`\`python
from utils import format_price

print(format_price(19.9))
\`\`\`

## 小项目建议

你可以从这些练习开始：

- 做一个命令行记账本
- 做一个课程目录管理脚本
- 做一个简单爬虫采集公开文章标题

### 下一步

当你已经能熟练使用函数、字典、循环之后，就可以继续学习：

- 面向对象
- 虚拟环境与依赖管理
- FastAPI / Flask
- 数据分析与自动化
`,
  },
]
