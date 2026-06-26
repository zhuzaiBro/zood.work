-- 导入 Python 基础文档课时到 lessons
-- course_id: 2afaa677-1f07-4d36-9b25-129a5fd346f1
-- chapter_id: 553d7163-7efb-4b82-b16b-6978a7e85e3a
-- 在 Supabase SQL Editor 中执行

BEGIN;

DELETE FROM public.lessons
WHERE id IN (
  '10100001-0001-4001-8001-553d71630101',
  '10100002-0002-4002-8002-553d71630202',
  '10100003-0003-4003-8003-553d71630303',
  '10100004-0004-4004-8004-553d71630404',
  '10100005-0005-4005-8005-553d71630505',
  '10100006-0006-4006-8006-553d71630606',
  '10100007-0007-4007-8007-553d71630707',
  '10100008-0008-4008-8008-553d71630808',
  '10100009-0009-4009-8009-553d71630909'
);

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  '10100001-0001-4001-8001-553d71630101',
  '553d7163-7efb-4b82-b16b-6978a7e85e3a',
  '01. 第一个 Python 程序',
  '用点外卖、打招呼等生活场景理解 print 与脚本执行。',
  $md1$
## 为什么从 Python 开始

Python 语法接近日常说话，适合先把「写指令让电脑做事」这件事变直觉，再进入工程化开发。

### 生活类比：给程序下指令

就像你在外卖 App 里点单——选餐厅、选菜品、确认下单——程序也是**从上到下**逐行执行指令。

### 第一个脚本

```python
print("Hello, Python!")
print("Welcome to zood.work")
```

### 再贴近生活一点

```python
restaurant = "楼下兰州拉面"
dish = "牛肉拉面"
price = 18

print("正在下单：", dish)
print("店铺：", restaurant)
print("应付：", price, "元")
```

### 这段代码做了什么

- `print()` 把结果展示出来（类似收银小票）
- 引号里的内容是**字符串**
- 程序从第 1 行执行到最后一行

### 一个好习惯

文件名见名知意，例如：

```text
hello.py
order_demo.py
variables_demo.py
```
$md1$,
  NULL, NULL, NULL, true, false,
  0
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  '10100002-0002-4002-8002-553d71630202',
  '553d7163-7efb-4b82-b16b-6978a7e85e3a',
  '02. 变量与基本类型',
  '用姓名、余额、会员状态等日常信息理解变量与类型。',
  $md2$
## 变量是什么

变量就像**贴了标签的盒子**：盒子里装数据，标签是名字，后面可以反复使用。

### 生活例子：个人信息

```python
name = "小明"          # 姓名
age = 22               # 年龄
balance = 128.50       # 钱包余额
is_vip = True          # 是否会员
```

### 常见基础类型

| 类型 | 生活例子 | Python 类型 |
|------|----------|-------------|
| 文本 | 手机号、地址 | `str` |
| 整数 | 库存 3 件 | `int` |
| 小数 | 体重 65.5 kg | `float` |
| 是否 | 是否已付款 | `bool` |

### 查看类型

```python
order_id = "NO20260318001"
amount = 39.9

print(type(order_id))  # <class 'str'>
print(type(amount))    # <class 'float'>
```

### 小练习：购物车心算

```python
milk_price = 6.5
bread_price = 4.0
egg_count = 10
egg_unit_price = 0.8

total = milk_price + bread_price + egg_count * egg_unit_price
print("今天买菜花了：", total, "元")
```

### 命名建议

- 用蛇形命名：`user_name`、`order_total`
- 避免 `a`、`temp1` 这种看不出含义的名字
- 变量名最好直接描述「装的是什么业务信息」
$md2$,
  NULL, NULL, NULL, true, false,
  1
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  '10100003-0003-4003-8003-553d71630303',
  '553d7163-7efb-4b82-b16b-6978a7e85e3a',
  '03. 条件判断与循环',
  '用天气穿衣、排队叫号、每日打卡理解 if 与循环。',
  $md3$
## 条件判断：生活中的「如果…就…」

```python
temperature = 28

if temperature >= 30:
    print("太热了，记得多喝水")
elif temperature >= 20:
    print("适合短袖出门")
else:
    print("有点凉，加件外套")
```

### 例子：地铁能否进站

```python
has_ticket = True
balance = 3.5

if has_ticket and balance >= 3:
    print("请进站")
else:
    print("请先购票或充值")
```

注意：Python 用**缩进**表示代码块，不是大括号。

## for 循环：逐个处理

就像快递员按清单逐件派送：

```python
packages = ["书", "耳机", "水杯"]

for item in packages:
    print("正在派送：", item)
```

### 例子：一周健身计划

```python
week_plan = ["跑步", "力量", "休息", "游泳", "瑜伽", "休息", "户外"]

for day, activity in enumerate(week_plan, start=1):
    print(f"第 {day} 天：{activity}")
```

## while 循环：直到条件不满足

```python
battery = 15

while battery < 100:
    print(f"充电中… 当前 {battery}%")
    battery += 20

print("可以拔线了")
```

### 什么时候用

- `if`：做选择（要不要带伞、能不能打折）
- `for`：清单上有多少项就处理多少项
- `while`：重复做某事直到条件达成（充电、排队）
$md3$,
  NULL, NULL, NULL, true, false,
  2
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  '10100004-0004-4004-8004-553d71630404',
  '553d7163-7efb-4b82-b16b-6978a7e85e3a',
  '04. 函数与参数',
  '把「算运费、打招呼」等重复动作封装成函数。',
  $md4$
## 函数：把重复动作打包

生活中「泡一杯咖啡」的步骤是固定的：拿杯 → 萃取 → 加奶。函数就是把固定步骤起个名字复用。

```python
def greet(name):
    print(f"你好，{name}，欢迎回来！")

greet("阿杰")
greet("Lily")
```

## 返回值

```python
def calc_delivery_fee(distance_km):
    if distance_km <= 3:
        return 0
    return (distance_km - 3) * 2

fee = calc_delivery_fee(5)
print("配送费：", fee, "元")
```

## 默认参数

```python
def make_coffee(size="中杯", sugar=True):
    sweet = "加糖" if sugar else "不加糖"
    return f"{size}咖啡（{sweet}）"

print(make_coffee())
print(make_coffee("大杯", sugar=False))
```

### 生活例子：账单分摊

```python
def split_bill(total, people=2):
    each = total / people
    return round(each, 2)

print("每人应付：", split_bill(186, 3), "元")
```

### 实战建议

- 一个函数只做一件事
- 名字用动词开头：`calc_`、`fetch_`、`format_`
$md4$,
  NULL, NULL, NULL, true, false,
  3
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  '10100005-0005-4005-8005-553d71630505',
  '553d7163-7efb-4b82-b16b-6978a7e85e3a',
  '05. 列表、字典与数据组织',
  '用购物清单、通讯录、订单列表理解 list 和 dict。',
  $md5$
## 列表 list：有序清单

购物清单就是典型列表——有顺序、能追加、能数有几个。

```python
shopping_list = ["鸡蛋", "牛奶", "面包"]

print(shopping_list[0])      # 第一项
shopping_list.append("咖啡")
print("共", len(shopping_list), "样")
```

## 字典 dict：键值对通讯录

联系人「名字 → 电话」非常适合用字典：

```python
contacts = {
    "妈妈": "13800001111",
    "同事-小王": "13900002222",
}

print(contacts["妈妈"])
print(contacts.get("快递站", "未保存"))
```

## 列表 + 字典：真实业务常见结构

外卖订单列表，每个订单是一个字典：

```python
orders = [
    {"shop": "黄焖鸡", "price": 28, "paid": True},
    {"shop": "奶茶铺", "price": 16, "paid": False},
]

for order in orders:
    status = "已支付" if order["paid"] else "待支付"
    print(order["shop"], order["price"], "元", status)
```

### 为什么重要

接口 JSON、数据库查询结果，本质经常是 **「对象列表」** 或 **「字段字典」**。
$md5$,
  NULL, NULL, NULL, true, false,
  4
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  '10100006-0006-4006-8006-553d71630606',
  '553d7163-7efb-4b82-b16b-6978a7e85e3a',
  '06. 文件、模块与小项目思维',
  '用记账本、配置文件理解读写文件与模块拆分。',
  $md6$
## 读写文件：像打开笔记本

```python
with open("daily_notes.txt", "w", encoding="utf-8") as file:
    file.write("Python 学习记录\n")
    file.write("今天学会了函数和字典\n")
```

```python
with open("daily_notes.txt", "r", encoding="utf-8") as file:
    content = file.read()
    print(content)
```

### 生活例子：追加一条记账

```python
record = "3月18日 午餐 35元\n"

with open("ledger.txt", "a", encoding="utf-8") as file:
    file.write(record)
```

## 模块导入：把工具分到不同文件

`utils.py` 放通用小工具：

```python
def format_price(price):
    return f"¥{price:.2f}"
```

主程序里复用：

```python
from utils import format_price

print(format_price(19.9))
```

## 小项目练手

- 命令行记账本（读写在文件里）
- 课程目录管理（list + dict）
- 批量重命名下载的图片

### 下一步

掌握基础后可以继续：类与对象、枚举、装饰器、Web 框架、自动化脚本。
$md6$,
  NULL, NULL, NULL, true, false,
  5
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  '10100007-0007-4007-8007-553d71630707',
  '553d7163-7efb-4b82-b16b-6978a7e85e3a',
  '07. 类 class 与对象',
  '用「用户账号、外卖订单」建模，理解面向对象。',
  $md7$
## 类是什么

**类**是模板，**对象**是根据模板创建的具体实例。

生活类比：
- 类 = 月饼模具
- 对象 = 一个个烤出来的月饼

### 定义一个简单的类

```python
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def introduce(self):
        return f"我是 {self.name}，{self.age} 岁"

user = User("小周", 25)
print(user.introduce())
```

### 生活例子：外卖订单

```python
class Order:
    def __init__(self, shop, items, total):
        self.shop = shop
        self.items = items
        self.total = total
        self.paid = False

    def pay(self):
        self.paid = True
        return f"{self.shop} 订单已支付 {self.total} 元"

order = Order("兰州拉面", ["牛肉面", "卤蛋"], 23)
print(order.pay())
print("支付状态：", order.paid)
```

### `__init__` 是什么

创建对象时自动执行，用来初始化属性（填好订单基本信息）。

### 什么时候用类

当数据和行为总是绑在一起出现，例如：
- 用户（姓名 + 登录）
- 订单（商品 + 支付）
- 课程（标题 + 进度）

下一节会讲 **枚举** 和 **访问修饰 / 装饰器**。
$md7$,
  NULL, NULL, NULL, true, false,
  6
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  '10100008-0008-4008-8008-553d71630808',
  '553d7163-7efb-4b82-b16b-6978a7e85e3a',
  '08. 枚举 Enum',
  '用订单状态、会员等级等固定选项理解 Enum。',
  $md8$
## 枚举解决什么问题

有些字段只能取**有限几个值**，比如订单状态、星期几、会员等级。用字符串容易拼错，用 **Enum** 更安全。

### 生活例子：订单状态

```python
from enum import Enum

class OrderStatus(Enum):
    PENDING = "待支付"
    PAID = "已支付"
    SHIPPING = "配送中"
    DONE = "已完成"
    CANCELLED = "已取消"

status = OrderStatus.PAID
print(status.name)   # PAID
print(status.value)  # 已支付
```

### 判断状态

```python
if status == OrderStatus.PAID:
    print("可以通知厨房备餐了")
```

### 例子：会员等级

```python
from enum import IntEnum

class VipLevel(IntEnum):
    NORMAL = 0
    SILVER = 1
    GOLD = 2
    PLATINUM = 3

def discount_rate(level: VipLevel) -> float:
    mapping = {
        VipLevel.NORMAL: 1.0,
        VipLevel.SILVER: 0.95,
        VipLevel.GOLD: 0.9,
        VipLevel.PLATINUM: 0.85,
    }
    return mapping[level]

price = 100
level = VipLevel.GOLD
print("实付：", price * discount_rate(level))
```

### 和 class 配合

```python
class Order:
    def __init__(self, shop, status=OrderStatus.PENDING):
        self.shop = shop
        self.status = status
```

### 小结

- Enum 让「固定选项」可读、可维护
- 比手写 `"paid"` / `"PAID"` / `"已支付"` 混用更不容易出错
$md8$,
  NULL, NULL, NULL, true, false,
  7
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  '10100009-0009-4009-8009-553d71630909',
  '553d7163-7efb-4b82-b16b-6978a7e85e3a',
  '09. 访问修饰与装饰器 @',
  '理解 _ 前缀约定与 @property、@staticmethod 等常见装饰器。',
  $md9$
## Python 的「访问修饰」

Python 没有 Java 那种 `public / private` 关键字，但用**命名约定**表达意图：

| 写法 | 含义 | 生活类比 |
|------|------|----------|
| `name` | 公开，随便用 | 门店招牌 |
| `_name` | 内部使用，别依赖 | 员工手册（外人别乱翻） |
| `__name` | 名称改写，更难在外部直接访问 | 保险柜（硬撬会有额外机制） |

```python
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner          # 公开
        self._balance = balance     # 内部属性
        self.__pin = "1234"         # 更敏感

    def deposit(self, amount):
        if amount > 0:
            self._balance += amount

    def get_balance(self):
        return self._balance

account = BankAccount("小周", 100)
account.deposit(50)
print(account.get_balance())
```

> 约定：看到单下划线 `_`，当作「请不要在类外面直接改它」。

## 装饰器 @ 是什么

装饰器 = **在不改原函数代码的前提下，给它加一层能力**。

生活类比：给外卖盒套一层保温袋——盒子还是那份饭，但多了「保温」功能。

### 常见内置装饰器

```python
class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def radius(self):
        return self._radius

    @property
    def area(self):
        return 3.14159 * self._radius ** 2

    @classmethod
    def unit(cls):
        return cls(1)

    @staticmethod
    def describe():
        return "这是一个圆"

c = Circle(3)
print(c.area)
print(Circle.describe())
print(Circle.unit().radius)
```

- `@property`：把方法当属性用（`c.area` 而不是 `c.area()`）
- `@classmethod`：操作类本身（例如工厂方法）
- `@staticmethod`：放在类命名空间里的普通工具函数

### 自定义装饰器：计时

```python
import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} 耗时 {time.time() - start:.4f}s")
        return result
    return wrapper

@timer
def brew_coffee():
    time.sleep(0.2)
    return "咖啡好了"

print(brew_coffee())
```

### 和 Web 开发的关系

FastAPI / Flask 里常见：

```python
# 伪代码示意
@app.get("/courses")
def list_courses():
    ...
```

`@app.get` 就是装饰器：把普通函数注册成「处理 GET 请求的路由」。

### 小结

- `_` / `__`：表达「别随便碰」的约定
- `@`：给函数或方法「套一层新能力」
- 先掌握 `@property`、`@staticmethod`、`@classmethod`，再读框架代码会轻松很多
$md9$,
  NULL, NULL, NULL, true, false,
  8
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL, video_url = NULL, duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

COMMIT;

-- 验证
SELECT id, title, sort_order,
       CASE WHEN content_markdown IS NULL THEN 0 ELSE length(content_markdown) END AS md_len
FROM public.lessons
WHERE chapter_id = '553d7163-7efb-4b82-b16b-6978a7e85e3a'
ORDER BY sort_order;