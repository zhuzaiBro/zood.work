-- 《Rust 上手》课程 — 内容来自 Tour of Rust 中文版
-- 来源: https://tourofrust.com/ （参考 03_zh-cn.html 起全部课时）
-- 生成: node .sql/generate_seed_rust_course.mjs
-- 在 Supabase SQL Editor 中执行

BEGIN;

INSERT INTO public.courses (id, title, description, is_free, status, price)
VALUES (
  'b2a30001-0001-4001-8001-000000000001',
  'Rust 上手',
  '基于 Tour of Rust 中文版的系统入门课，从变量、控制流、所有权到智能指针与项目结构，每课含可运行 Rust 示例代码。内容来源：https://tourofrust.com/',
  true,
  'published',
  0
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status,
  price = EXCLUDED.price,
  updated_at = NOW();

DELETE FROM public.lessons WHERE chapter_id IN (
  'b2a30000-0001-4001-8001-000000000100',
  'b2a30001-0001-4001-8001-000000000101',
  'b2a30002-0001-4001-8001-000000000102',
  'b2a30003-0001-4001-8001-000000000103',
  'b2a30004-0001-4001-8001-000000000104',
  'b2a30005-0001-4001-8001-000000000105',
  'b2a30006-0001-4001-8001-000000000106',
  'b2a30007-0001-4001-8001-000000000107',
  'b2a30008-0001-4001-8001-000000000108',
  'b2a30009-0001-4001-8001-000000000109'
);

DELETE FROM public.chapters WHERE id IN (
  'b2a30000-0001-4001-8001-000000000100',
  'b2a30001-0001-4001-8001-000000000101',
  'b2a30002-0001-4001-8001-000000000102',
  'b2a30003-0001-4001-8001-000000000103',
  'b2a30004-0001-4001-8001-000000000104',
  'b2a30005-0001-4001-8001-000000000105',
  'b2a30006-0001-4001-8001-000000000106',
  'b2a30007-0001-4001-8001-000000000107',
  'b2a30008-0001-4001-8001-000000000108',
  'b2a30009-0001-4001-8001-000000000109'
);

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30000-0001-4001-8001-000000000100', 'b2a30001-0001-4001-8001-000000000001', '入门', 'Tour of Rust · 入门', 0)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30001-0001-4001-8001-000000000101', 'b2a30001-0001-4001-8001-000000000001', '第一章 - 基础知识', 'Tour of Rust · 第一章 - 基础知识', 1)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30002-0001-4001-8001-000000000102', 'b2a30001-0001-4001-8001-000000000001', '第二章 - 基本控制流', 'Tour of Rust · 第二章 - 基本控制流', 2)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30003-0001-4001-8001-000000000103', 'b2a30001-0001-4001-8001-000000000001', '第三章 - 基本数据结构类型', 'Tour of Rust · 第三章 - 基本数据结构类型', 3)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30004-0001-4001-8001-000000000104', 'b2a30001-0001-4001-8001-000000000001', '第四章 - 泛型', 'Tour of Rust · 第四章 - 泛型', 4)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30005-0001-4001-8001-000000000105', 'b2a30001-0001-4001-8001-000000000001', '第五章 - 所有权和数据借用', 'Tour of Rust · 第五章 - 所有权和数据借用', 5)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30006-0001-4001-8001-000000000106', 'b2a30001-0001-4001-8001-000000000001', '第六章 - 文本', 'Tour of Rust · 第六章 - 文本', 6)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30007-0001-4001-8001-000000000107', 'b2a30001-0001-4001-8001-000000000001', '第七章 - 面向对象编程', 'Tour of Rust · 第七章 - 面向对象编程', 7)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30008-0001-4001-8001-000000000108', 'b2a30001-0001-4001-8001-000000000001', '第8章 - 智能指针', 'Tour of Rust · 第8章 - 智能指针', 8)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES ('b2a30009-0001-4001-8001-000000000109', 'b2a30001-0001-4001-8001-000000000001', '第九章 - 项目的结构和管理', 'Tour of Rust · 第九章 - 项目的结构和管理', 9)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  'b2a30000-0001-4001-8001-000000000000',
  'b2a30000-0001-4001-8001-000000000100',
  '00. 你好，',
  '欢迎来到 *Rust 语言之旅*。本教程旨在循序渐进地介绍 Rust 编程语言的特性。大家通常认为 Rust 是一门学习曲线陡峭的语言。我希望在此说明，在我们开始学习复杂的部分之前，还有很多东西需要探索。',
  $rust0$欢迎来到 *Rust 语言之旅*。本教程旨在循序渐进地介绍 Rust 编程语言的特性。大家通常认为 Rust 是一门学习曲线陡峭的语言。我希望在此说明，在我们开始学习复杂的部分之前，还有很多东西需要探索。

你可以通过以下这些语言来阅读本教程：

- Deutsch

- English

- Español

- Français

- Interlingue

- Magyar

- Polski

- Português Brasileiro

- Română

- Русский

- 简体中文

- 繁體中文

- 日本語

- 한국어

- Türkçe

- Українська

- ภาษาไทย

- Tiếng Việt
如果你对内容有任何建议，或者想参与翻译做出贡献，请查看 Rust 语言之旅的 GitHub 代码库。

你可以使用 ⬅️ 和 ➡️ 浏览整个教程。

在这个经典的例子中，我们展示了 Rust 对 Unicode 字符串的支持。

### 示例代码

```rust
fn main() {
    println!("你好，🦀");
}
```$rust0$,
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
  'b2a30002-0001-4001-8001-000000000002',
  'b2a30001-0001-4001-8001-000000000101',
  '02. Rust 练习场',
  '本教程使用的是来自 Rust 练习场 的交互代码工具。',
  $rust2$本教程使用的是来自 Rust 练习场 的交互代码工具。

这是一个玩转 Rust 并且向别人展示你的创造和挑战的最好工具。

### 示例代码

```rust
fn main() {
    println!("欢迎来到练习场！你可以修改这儿的代码。");
}
```$rust2$,
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
  'b2a30003-0001-4001-8001-000000000003',
  'b2a30001-0001-4001-8001-000000000101',
  '03. 变量',
  '变量使用 **let** 关键字来声明。',
  $rust3$变量使用 **let** 关键字来声明。

在赋值时，Rust 能够在 99% 的情况下自动推断其类型。如果不能，你也可以手动将类型添加到变量声明中。

你也许注意到了，我们可以对同一个变量名进行多次赋值。这就是所谓的变量隐藏，可以更改变量类型以实现对该变量名的后续使用。

变量名总是遵循 `蛇形命名法` (snake_case)。

### 示例代码

```rust
fn main() {
    // rust 推断出x的类型
    let x = 13;
    println!("{}", x);

    // rust也可以显式声明类型
    let x: f64 = 3.14159;
    println!("{}", x);

    // rust 也支持先声明后初始化，但很少这样做
    let x;
    x = 0;
    println!("{}", x);
}
```$rust3$,
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
  'b2a30004-0001-4001-8001-000000000004',
  'b2a30001-0001-4001-8001-000000000101',
  '04. 修改变量',
  'Rust 非常关心哪些变量是可修改的。值分为两种类型：',
  $rust4$Rust 非常关心哪些变量是可修改的。值分为两种类型：

- **可变的** - 编译器允许对变量进行读取和写入。

- **不可变的** - 编译器只允许对变量进行读取。

可变值用 **mut** 关键字表示。

关于这个概念，我们之后还会有更多的内容，但是眼下请谨记这个关键字即可。

### 示例代码

```rust
fn main() {
    let mut x = 42;
    println!("{}", x);
    x = 13;
    println!("{}", x);
}
```$rust4$,
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
  'b2a30005-0001-4001-8001-000000000005',
  'b2a30001-0001-4001-8001-000000000101',
  '05. 基本类型',
  'Rust 有多种常见的类型：',
  $rust5$Rust 有多种常见的类型：

- 布尔型 - `bool` 表示 true 或 false

- 无符号整型- `u8` `u32` `u64` `u128` 表示非负整数

- 有符号整型 - `i8` `i32` `i64` `i128` 表示整数

- 指针大小的整数 - `usize` `isize` 表示内存中内容的索引和大小

- 浮点数 - `f32` `f64`

- 元组（tuple） - `(value, value, ...)` 用于在栈上传递固定序列的值

- 数组 - 在编译时已知的具有固定长度的相同元素的集合

- 切片（slice） - 在运行时已知长度的相同元素的集合

- `str`(string slice) - 在运行时已知长度的文本

文本可能比你在其他语言中学到的更复杂，因为 Rust 是一种系统编程语言，它关心的是你可能不太习惯的内存问题。
我们之后将详细讨论这个问题。

另外，你也可以通过将类型附加到数字的末尾来明确指定数字类型（如 `13u32` 和 `2u8`）

### 示例代码

```rust
fn main() {
    let x = 12; // 默认情况下，这是i32
    let a = 12u8;
    let b = 4.3; // 默认情况下，这是f64
    let c = 4.3f32;
    let bv = true;
    let t = (13, false);
    let sentence = "hello world!";
    println!(
        "{} {} {} {} {} {} {} {}",
        x, a, b, c, bv, t.0, t.1, sentence
    );
}
```$rust5$,
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
  'b2a30006-0001-4001-8001-000000000006',
  'b2a30001-0001-4001-8001-000000000101',
  '06. 基本类型转换',
  '当涉及到数字类型时，Rust 要求明确。一个人不能想当然地把“u8”用在“u32”上而不出错。',
  $rust6$当涉及到数字类型时，Rust 要求明确。一个人不能想当然地把“u8”用在“u32”上而不出错。

幸运的是，使用 **as** 关键字，Rust 使数字类型转换非常容易。

### 示例代码

```rust
fn main() {
    let a = 13u8;
    let b = 7u32;
    let c = a as u32 + b;
    println!("{}", c);

    let t = true;
    println!("{}", t as u8);
}
```$rust6$,
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
  'b2a30007-0001-4001-8001-000000000007',
  'b2a30001-0001-4001-8001-000000000101',
  '07. 常量',
  '常量允许我们高效地指定一个在代码中会被多次使用的公共值。不同于像变量一样在使用的时候会被复制，常量会在编译期间直接用它们的值来替换变量的文本标识符。',
  $rust7$常量允许我们高效地指定一个在代码中会被多次使用的公共值。不同于像变量一样在使用的时候会被复制，常量会在编译期间直接用它们的值来替换变量的文本标识符。

不同于变量，常量必须始终具有显式的类型。

常量名总是遵循 `全大写蛇形命名法（SCREAMING_SNAKE_CASE）`。

### 示例代码

```rust
const PI: f32 = 3.14159;

fn main() {
    println!(
        "To make an apple {} from scratch, you must first create a universe.",
        PI
    );
}
```$rust7$,
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
  'b2a30008-0001-4001-8001-000000000008',
  'b2a30001-0001-4001-8001-000000000101',
  '08. 数组',
  '*数组*是所有相同类型数据元素的固定长度集合。',
  $rust8$*数组*是所有相同类型数据元素的固定长度集合。

一个*数组*的数据类型是 `[T;N]`，其中 T 是元素的类型，N 是编译时已知的固定长度。

可以使用 `[x]` 运算符提取单个元素，其中 *x* 是所需元素的 *usize* 索引（从 0 开始）。

### 示例代码

```rust
fn main() {
    let nums: [i32; 3] = [1, 2, 3];
    println!("{:?}", nums);
    println!("{}", nums[1]);
}
```$rust8$,
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
  'b2a30009-0001-4001-8001-000000000009',
  'b2a30001-0001-4001-8001-000000000101',
  '09. 函数',
  '函数可以有 0 个或者多个参数。',
  $rust9$函数可以有 0 个或者多个参数。

在这个例子中，add 接受类型为 `i32`（32 位长度的整数）的两个参数。

函数名总是遵循 `蛇形命名法` (snake_case)。

### 示例代码

```rust
fn add(x: i32, y: i32) -> i32 {
    return x + y;
}

fn main() {
    println!("{}", add(42, 13));
}
```$rust9$,
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
  'b2a30010-0001-4001-8001-000000000010',
  'b2a30001-0001-4001-8001-000000000101',
  '10. 多个返回值',
  '函数可以通过**元组**来返回多个值。',
  $rust10$函数可以通过**元组**来返回多个值。

元组元素可以通过他们的索引来获取。

Rust 允许我们将后续会看到的各种形式的解构，也允许我们以符合逻辑的方式提取数据结构的子片段。敬请期待后面的内容！

### 示例代码

```rust
fn swap(x: i32, y: i32) -> (i32, i32) {
    return (y, x);
}

fn main() {
    // 返回一个元组
    let result = swap(123, 321);
    println!("{} {}", result.0, result.1);

    // 将元组解构为两个变量
    let (a, b) = swap(result.0, result.1);
    println!("{} {}", a, b);
}
```$rust10$,
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

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  'b2a30011-0001-4001-8001-000000000011',
  'b2a30001-0001-4001-8001-000000000101',
  '11. 返回空值',
  '如果没有为函数指定返回类型，它将返回一个空的元组，也称为*单元*。',
  $rust11$如果没有为函数指定返回类型，它将返回一个空的元组，也称为*单元*。

一个空的元组用 `()` 表示。

直接使用 `()` 的情况相当不常见。但它经常会出现（比如作为函数返回值），所以了解其来龙去脉非常重要。

### 示例代码

```rust
fn make_nothing() -> () {
    return ();
}

// 返回类型隐含为 ()
fn make_nothing2() {
    // 如果没有指定返回值，这个函数将会返回 ()
}

fn main() {
    let a = make_nothing();
    let b = make_nothing2();

    // 打印a和b的debug字符串，因为很难去打印空
    println!("The value of a: {:?}", a);
    println!("The value of b: {:?}", b);
}
```$rust11$,
  NULL, NULL, NULL, true, false,
  9
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
  'b2a30012-0001-4001-8001-000000000012',
  'b2a30001-0001-4001-8001-000000000101',
  '12. 第一章总结',
  '到目前为止一切都进展顺利！ Rust 的基础知识还不赖，对吧？ 我们一起窥探了 Rust 编译器是如何思考的。',
  $rust12$到目前为止一切都进展顺利！ Rust 的基础知识还不赖，对吧？ 我们一起窥探了 Rust 编译器是如何思考的。
作为一种系统编程语言，它非常关心内存中值的大小，是否可以修改内容，并确保数值符合你的预期。
接下来，我们将看一些老朋友：`if` 判断和 `for` 循环。

其他教学资源（英文）：

- Youtube 视频：Rust Cast - 深入了解 Rust 的基础数字类型
types

- 网页：Rust 之书 2018 - 基本数据的深层描述
types

- 网页：Rust Cheat Sheet - 数据类型$rust12$,
  NULL, NULL, NULL, true, false,
  10
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
  'b2a30014-0001-4001-8001-000000000014',
  'b2a30002-0001-4001-8001-000000000102',
  '14. if/else if/else',
  'Rust 中的代码分支不足为奇。',
  $rust14$Rust 中的代码分支不足为奇。

Rust 的条件判断没有括号！~~需要括号干什么。~~我们现有的逻辑就看起来就很干净整洁呀。

不过呢，所有常见的逻辑运算符仍然适用：`==`，`!=`， `<`， `>`， `<=`， `>=`， `!`， `||`， `&&`

### 示例代码

```rust
fn main() {
    let x = 42;
    if x < 42 {
        println!("less than 42");
    } else if x == 42 {
        println!("is 42");
    } else {
        println!("greater than 42");
    }
}
```$rust14$,
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
  'b2a30015-0001-4001-8001-000000000015',
  'b2a30002-0001-4001-8001-000000000102',
  '15. 循环',
  '需要一个无限循环？',
  $rust15$需要一个无限循环？

使用 Rust 很容易实现。

`break` 会退出当前循环。但 `loop` 还有个秘密，我们很快讲到。

### 示例代码

```rust
fn main() {
    let mut x = 0;
    loop {
        x += 1;
        if x == 42 {
            break;
        }
    }
    println!("{}", x);
}
```$rust15$,
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
  'b2a30016-0001-4001-8001-000000000016',
  'b2a30002-0001-4001-8001-000000000102',
  '16. while',
  '`while` 允许你轻松地向循环添加条件。',
  $rust16$`while` 允许你轻松地向循环添加条件。

如果条件一旦变为 `false`，循环就会退出。

### 示例代码

```rust
fn main() {
    let mut x = 0;
    while x != 42 {
        x += 1;
    }
}
```$rust16$,
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
  'b2a30017-0001-4001-8001-000000000017',
  'b2a30002-0001-4001-8001-000000000102',
  '17. for',
  'Rust 的 `for` 循环是一个强大的升级。它遍历来自计算结果为迭代器的任意表达式的值。',
  $rust17$Rust 的 `for` 循环是一个强大的升级。它遍历来自计算结果为迭代器的任意表达式的值。
迭代器是什么？迭代器是一个你可以一直询问“下一项是什么？”直到没有其他项的对象。

我们将在以后的章节中进一步探讨这一点，与此同时，我们知道 Rust 使创建生成整数序列的迭代器变得容易。

`..` 运算符创建一个可以生成包含起始数字、但不包含末尾数字的数字序列的迭代器。

`..=` 运算符创建一个可以生成包含起始数字、且包含末尾数字的数字序列的迭代器。

### 示例代码

```rust
fn main() {
    for x in 0..5 {
        println!("{}", x);
    }

    for x in 0..=5 {
        println!("{}", x);
    }
}
```$rust17$,
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
  'b2a30018-0001-4001-8001-000000000018',
  'b2a30002-0001-4001-8001-000000000102',
  '18. match',
  '想念你的 switch 语句吗？Rust 有一个非常有用的关键字，用于匹配值的所有可能条件，',
  $rust18$想念你的 switch 语句吗？Rust 有一个非常有用的关键字，用于匹配值的所有可能条件，
并在匹配为真时执行相应代码。我们先来看看对数字的使用。在未来章节中，我们将有更多
更复杂的数据模式匹配的说明，我向你保证，它将值得等待。

`match` 是穷尽的，意为所有可能的值都必须被考虑到。

匹配与解构相结合是迄今为止你在 Rust 中看到的最常见的模式之一。

### 示例代码

```rust
fn main() {
    let x = 42;

    match x {
        0 => {
            println!("found zero");
        }
        // 我们可以匹配多个值
        1 | 2 => {
            println!("found 1 or 2!");
        }
        // 我们可以匹配迭代器
        3..=9 => {
            println!("found a number 3 to 9 inclusively");
        }
        // 我们可以将匹配数值绑定到变量
        matched_num @ 10..=100 => {
            println!("found {} number between 10 to 100!", matched_num);
        }
        // 这是默认匹配，如果没有处理所有情况，则必须存在该匹配
        _ => {
            println!("found something else!");
        }
    }
}
```$rust18$,
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
  'b2a30019-0001-4001-8001-000000000019',
  'b2a30002-0001-4001-8001-000000000102',
  '19. 从循环中返回值',
  '`loop` 可以被中断以返回一个值。',
  $rust19$`loop` 可以被中断以返回一个值。

### 示例代码

```rust
fn main() {
    let mut x = 0;
    let v = loop {
        x += 1;
        if x == 13 {
            break "found the 13";
        }
    };
    println!("from loop: {}", v);
}
```$rust19$,
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
  'b2a30020-0001-4001-8001-000000000020',
  'b2a30002-0001-4001-8001-000000000102',
  '20. 从块表达式返回值',
  '`if`，`match`，函数，以及作用域块都有一种返回值的独特方式。',
  $rust20$`if`，`match`，函数，以及作用域块都有一种返回值的独特方式。

如果 `if`、`match`、函数或作用域块中的最后一条语句是不带 `;` 的表达式，
Rust 将把它作为一个值从块中返回。这是一种创建简洁逻辑的好方法，它返回一个
可以放入新变量的值。

注意，它还允许 `if` 语句像简洁的三元表达式一样操作。

### 示例代码

```rust
fn example() -> i32 {
    let x = 42;
    // Rust的三元表达式
    let v = if x < 42 { -1 } else { 1 };
    println!("from if: {}", v);

    let food = "hamburger";
    let result = match food {
        "hotdog" => "is hotdog",
        // 注意，当它只是一个返回表达式时，大括号是可选的
        _ => "is not hotdog",
    };
    println!("identifying food: {}", result);

    let v = {
        // 这个作用域块让我们得到一个不影响函数作用域的结果
        let a = 1;
        let b = 2;
        a + b
    };
    println!("from block: {}", v);

    // 在最后从函数中返回值的惯用方法
    v + 4
}

fn main() {
    println!("from function: {}", example());
}
```$rust20$,
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
  'b2a30021-0001-4001-8001-000000000021',
  'b2a30002-0001-4001-8001-000000000102',
  '21. 第二章总结',
  '希望即便是在最基本的语言特性中，我也已经向你展示了 Rust 的强大功能。',
  $rust21$希望即便是在最基本的语言特性中，我也已经向你展示了 Rust 的强大功能。
我们将在后续章节更深入地讨论 `for` 和 `match`，因为我们将获得更多可以
利用它们能力的知识。接下来，我们将讨论 Rust 的基本数据结构。$rust21$,
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
  'b2a30023-0001-4001-8001-000000000023',
  'b2a30003-0001-4001-8001-000000000103',
  '23. 结构体',
  '一个 `struct` 就是一些字段的集合。',
  $rust23$一个 `struct` 就是一些字段的集合。

*字段*是一个与数据结构相关联的数据值。它的值可以是基本类型或结构体类型。

它的定义就像给编译器的蓝图，告诉编译器如何在内存中布局彼此相邻的字段。

### 示例代码

```rust
struct SeaCreature {
    // String 是个结构体
    animal_type: String,
    name: String,
    arms: i32,
    legs: i32,
    weapon: String,
}
```$rust23$,
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
  'b2a30024-0001-4001-8001-000000000024',
  'b2a30003-0001-4001-8001-000000000103',
  '24. 方法调用',
  '与函数（function）不同，方法（method）是与特定数据类型关联的函数。',
  $rust24$与函数（function）不同，方法（method）是与特定数据类型关联的函数。

**静态方法** — 属于某个类型，调用时使用 `::` 运算符。

**实例方法** — 属于某个类型的实例，调用时使用 `.` 运算符。

我们将在后续章节中更多地讨论如何创建自己的方法。

### 示例代码

```rust
fn main() {
    // 使用静态方法来创建一个String实例
    let s = String::from("Hello world!");
    // 使用实例来调用方法
    println!("{} is {} characters long.", s, s.len());
}
```$rust24$,
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
  'b2a30025-0001-4001-8001-000000000025',
  'b2a30003-0001-4001-8001-000000000103',
  '25. 内存',
  'Rust 程序有 3 个存放数据的内存区域：',
  $rust25$Rust 程序有 3 个存放数据的内存区域：

- **数据内存** - 对于固定大小和**静态**（即在整个程序生命周期中都存在）的数据。
考虑一下程序中的文本（例如 “Hello World”），该文本的字节只能读取，因此它们位于该区域中。
编译器对这类数据做了很多优化，由于位置已知且固定，因此通常认为编译器使用起来非常快。

- **栈内存** - 对于在函数中声明为变量的数据。
在函数调用期间，内存的位置不会改变，因为编译器可以优化代码，所以栈数据使用起来比较快。

- **堆内存** - 对于在程序运行时创建的数据。
此区域中的数据可以添加、移动、删除、调整大小等。由于它的动态特性，通常认为它使用起来比较慢，
但是它允许更多创造性的内存使用。当数据添加到该区域时，我们称其为**分配**。 从本区域中删除
数据后，我们将其称为**释放**。$rust25$,
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
  'b2a30026-0001-4001-8001-000000000026',
  'b2a30003-0001-4001-8001-000000000103',
  '26. 在内存中创建数据',
  '当我们在代码中**实例化**一个**结构体**时，我们的程序会在内存中并排创建关联的字段数据。',
  $rust26$当我们在代码中**实例化**一个**结构体**时，我们的程序会在内存中并排创建关联的字段数据。

当我们通过制定所有字段值的方式来实例化时：

`结构体名 { ... }`.

结构体字段可以通过 `.` 运算符来获取。

我们例子的内存详情：

- 引号内的文本是只读数据（例如“ferris”），因此它位于*数据内存区*。

- 函数调用 `String::from` 创建一个结构体 `String`，该结构体与 SeaCreature 的字段并排放置在*栈*中。
字符串容器通过如下步骤表示可更改的文本：

在*堆*上创建可修改文本的内存。

- 将*堆*中存储对象的内存位置的引用存储在 `String` 结构体中（在以后的课程中会详细介绍）。

- 最后，我们的两个朋友 *Ferris* 和 *Sarah* 有在程序中总是固定的位置的数据结构，所以它们被放在*栈*上。

### 示例代码

```rust
struct SeaCreature {
    animal_type: String,
    name: String,
    arms: i32,
    legs: i32,
    weapon: String,
}

fn main() {
    // SeaCreature的数据在栈上
    let ferris = SeaCreature {
        // String 结构体也在栈上，
        // 但也存放了一个数据在堆上的引用
        animal_type: String::from("螃蟹"),
        name: String::from("Ferris"),
        arms: 2,
        legs: 4,
        weapon: String::from("大钳子"),
    };

    let sarah = SeaCreature {
        animal_type: String::from("章鱼"),
        name: String::from("Sarah"),
        arms: 8,
        legs: 0,
        weapon: String::from("无"),
    };
    
    println!(
        "{} 是只{}。它有 {} 只胳膊 {} 条腿，还有一个{}。",
        ferris.name, ferris.animal_type, ferris.arms, ferris.legs, ferris.weapon
    );
    println!(
        "{} 是只{}。它有 {} 只胳膊 {} 条腿。它没有杀伤性武器…",
        sarah.name, sarah.animal_type, sarah.arms, sarah.legs
    );
}
```$rust26$,
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
  'b2a30027-0001-4001-8001-000000000027',
  'b2a30003-0001-4001-8001-000000000103',
  '27. 类元组结构体',
  '简洁起见，你可以创建像元组一样被使用的结构体。',
  $rust27$简洁起见，你可以创建像元组一样被使用的结构体。

### 示例代码

```rust
struct Location(i32, i32);

fn main() {
    // 这仍然是一个在栈上的结构体
    let loc = Location(42, 32);
    println!("{}, {}", loc.0, loc.1);
}
```$rust27$,
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
  'b2a30028-0001-4001-8001-000000000028',
  'b2a30003-0001-4001-8001-000000000103',
  '28. 类单元结构体',
  '结构体也可以没有任何字段。',
  $rust28$结构体也可以没有任何字段。

就像第一章提到的，一个 *unit* 是空元组 `()` 的别称。这就是为什么，此类结构体被称为 `类单元`。

这种类型的结构体很少用到。

### 示例代码

```rust
struct Marker;

fn main() {
    let _m = Marker;
}
```$rust28$,
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
  'b2a30029-0001-4001-8001-000000000029',
  'b2a30003-0001-4001-8001-000000000103',
  '29. 枚举',
  '枚举允许你使用 `enum` 关键字创建一个新类型，该类型的值可以包含几个带标记的元素。',
  $rust29$枚举允许你使用 `enum` 关键字创建一个新类型，该类型的值可以包含几个带标记的元素。

`match` 有助于确保对所有可能的枚举值进行彻底的处理，使其成为确保高质量代码的强大工具。

### 示例代码

```rust
#![allow(dead_code)] // this line prevents compiler warnings

enum Species {
    Crab,
    Octopus,
    Fish,
    Clam
}

struct SeaCreature {
    species: Species,
    name: String,
    arms: i32,
    legs: i32,
    weapon: String,
}

fn main() {
    let ferris = SeaCreature {
        species: Species::Crab,
        name: String::from("Ferris"),
        arms: 2,
        legs: 4,
        weapon: String::from("claw"),
    };

    match ferris.species {
        Species::Crab => println!("{} is a crab",ferris.name),
        Species::Octopus => println!("{} is a octopus",ferris.name),
        Species::Fish => println!("{} is a fish",ferris.name),
        Species::Clam => println!("{} is a clam",ferris.name),
    }
}
```$rust29$,
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
  'b2a30030-0001-4001-8001-000000000030',
  'b2a30003-0001-4001-8001-000000000103',
  '30. 带数据的枚举',
  '`enum` 的元素可以有一个或多个数据类型，从而使其表现得像 C 语言中的*联合*。',
  $rust30$`enum` 的元素可以有一个或多个数据类型，从而使其表现得像 C 语言中的*联合*。

当使用 `match` 对一个 `enum` 进行模式匹配时，可以将变量名称绑定到每个数据值。

`enum` 的内存细节：

- 枚举数据的内存大小等于它最大元素的大小。此举是为了让所有可能的值都能存入相同的内存空间。

- 除了元素数据类型（如果有）之外，每个元素还有一个数字值，用于表示它是哪个标签。

其他细节：

- Rust 的 `enum` 也被称为*标签联合* （tagged-union）

- 把类型组合成一种新的类型，这就是人们所说的 Rust 具有 *代数类型* 的含义。

### 示例代码

```rust
#![allow(dead_code)] // this line prevents compiler warnings

enum Species { Crab, Octopus, Fish, Clam }
enum PoisonType { Acidic, Painful, Lethal }
enum Size { Big, Small }
enum Weapon {
    Claw(i32, Size),
    Poison(PoisonType),
    None
}

struct SeaCreature {
    species: Species,
    name: String,
    arms: i32,
    legs: i32,
    weapon: Weapon,
}

fn main() {
    // SeaCreature's data is on stack
    let ferris = SeaCreature {
        // String struct is also on stack,
        // but holds a reference to data on heap
        species: Species::Crab,
        name: String::from("Ferris"),
        arms: 2,
        legs: 4,
        weapon: Weapon::Claw(2, Size::Small),
    };

    match ferris.species {
        Species::Crab => {
            match ferris.weapon {
                Weapon::Claw(num_claws,size) => {
                    let size_description = match size {
                        Size::Big => "big",
                        Size::Small => "small"
                    };
                    println!("ferris is a crab with {} {} claws", num_claws, size_description)
                },
                _ => println!("ferris is a crab with some other weapon")
            }
        },
        _ => println!("ferris is some other animal"),
    }
}
```$rust30$,
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
  'b2a30031-0001-4001-8001-000000000031',
  'b2a30003-0001-4001-8001-000000000103',
  '31. 第三章 - 总结',
  '太好了！现在我们有了一些用代码来展示我们想法最基本的工具。',
  $rust31$太好了！现在我们有了一些用代码来展示我们想法最基本的工具。
希望现在我们能看到 Rust 的基本操作是如何与它的类型和谐一致地工作的。
接下来我们将讨论一个概念，它为我们的数据类型提供了更大的灵活性：*泛型*。$rust31$,
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

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  'b2a30033-0001-4001-8001-000000000033',
  'b2a30004-0001-4001-8001-000000000104',
  '33. 泛型是什么？',
  '泛型允许我们不完全定义一个 `struct` 或 `enum`，使编译器能够根据我们的代码使用情况，在编译时创建一个完全定义的版本。',
  $rust33$泛型允许我们不完全定义一个 `struct` 或 `enum`，使编译器能够根据我们的代码使用情况，在编译时创建一个完全定义的版本。

Rust 通常可以通过查看我们的实例化来推断出最终的类型，但是如果需要帮助，你可以使用 `::<T>` 操作符来显式地进行操作，
该操作符也被称为 `turbofish` （它是我的好朋友！）。

### 示例代码

```rust
// 一个部分定义的结构体类型
struct BagOfHolding<T> {
    item: T,
}

fn main() {
    // 注意：通过使用泛型，我们创建了编译时创建的类型，使代码更大
    // Turbofish 使之显式化
    let i32_bag = BagOfHolding::<i32> { item: 42 };
    let bool_bag = BagOfHolding::<bool> { item: true };
    
    // Rust 也可以推断出泛型的类型！
    let float_bag = BagOfHolding { item: 3.14 };

    // 注意：在现实生活中，不要把一袋东西放在另一袋东西里:)
    let bag_in_bag = BagOfHolding {
        item: BagOfHolding { item: "嘭！" },
    };

    println!(
        "{} {} {} {}",
        i32_bag.item, bool_bag.item, float_bag.item, bag_in_bag.item.item
    );
}
```$rust33$,
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
  'b2a30034-0001-4001-8001-000000000034',
  'b2a30004-0001-4001-8001-000000000104',
  '34. 表示空',
  '在其他语言中，关键字 `null` 用于表示没有值。它给编程语言带来了困难，因为它使我们的程序在与变量字段交互时可能失败。',
  $rust34$在其他语言中，关键字 `null` 用于表示没有值。它给编程语言带来了困难，因为它使我们的程序在与变量字段交互时可能失败。

Rust 没有 `null`，但这并不代表我们不知道表示空的重要性！我们可以使用一个我们已经了解过的工具来简单地表示这一点。

因为缺少 `null` 值，这种为一个或多个替代值提供 `None` 替代表示的模式非常常见，
泛型有助于解决这一难题。

### 示例代码

```rust
enum Item {
    Inventory(String),
    // None represents the absence of an item
    None,
}

struct BagOfHolding {
    item: Item,
}
```$rust34$,
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
  'b2a30035-0001-4001-8001-000000000035',
  'b2a30004-0001-4001-8001-000000000104',
  '35. Option',
  'Rust 有一个内置的泛型枚举叫做 `Option`，它可以让我们不使用 `null` 就可以表示可以为空的值。',
  $rust35$Rust 有一个内置的泛型枚举叫做 `Option`，它可以让我们不使用 `null` 就可以表示可以为空的值。

`enum Option<T> {
    None,
    Some(T),
}
`
这个枚举很常见，使用关键字 `Some` 和 `None` 可以在任何地方创建其实例。

### 示例代码

```rust
// 一个部分定义的结构体
struct BagOfHolding<T> {
    // 我们的参数类型T可以传递给其他
    item: Option<T>,
}

fn main() {
    // 注意：一个放 i32 的 bag，里面什么都没有！
    // 我们必须注明类型，否则 Rust 不知道 bag 的类型
    let i32_bag = BagOfHolding::<i32> { item: None };

    if i32_bag.item.is_none() {
        println!("there's nothing in the bag!")
    } else {
        println!("there's something in the bag!")
    }

    let i32_bag = BagOfHolding::<i32> { item: Some(42) };

    if i32_bag.item.is_some() {
        println!("there's something in the bag!")
    } else {
        println!("there's nothing in the bag!")
    }

    // match 可以让我们优雅地解构 Option，并且确保我们处理了所有的可能情况！
    match i32_bag.item {
        Some(v) => println!("found {} in bag!", v),
        None => println!("found nothing"),
    }
}
```$rust35$,
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
  'b2a30036-0001-4001-8001-000000000036',
  'b2a30004-0001-4001-8001-000000000104',
  '36. Result',
  'Rust 有一个内置的泛型枚举叫做 `Result`，它可以让我们返回一个可能包含错误的值。',
  $rust36$Rust 有一个内置的泛型枚举叫做 `Result`，它可以让我们返回一个可能包含错误的值。
这是编程语言进行错误处理的惯用方法。

`enum Result<T, E> {
    Ok(T),
    Err(E),
}
`
注意我们的泛型有多个用逗号分隔的*参数化的类型*。

这个枚举很常见，使用关键字 `Ok` 和 `Err` 可以在任何地方创建其实例。

### 示例代码

```rust
fn do_something_that_might_fail(i:i32) -> Result<f32,String> {
    if i == 42 {
        Ok(13.0)
    } else {
        Err(String::from("this is not the right number"))   
    }
}

fn main() {
    let result = do_something_that_might_fail(12);

    // match 让我优雅地解构 Rust，并且确保我们处理了所有情况！
    match result {
        Ok(v) => println!("found {}", v),
        Err(e) => println!("Error: {}",e),
    }
}
```$rust36$,
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
  'b2a30037-0001-4001-8001-000000000037',
  'b2a30004-0001-4001-8001-000000000104',
  '37. 可失败的主函数',
  '`main` 函数有可以返回 `Result` 的能力！',
  $rust37$`main` 函数有可以返回 `Result` 的能力！

### 示例代码

```rust
fn do_something_that_might_fail(i: i32) -> Result<f32, String> {
    if i == 42 {
        Ok(13.0)
    } else {
        Err(String::from("this is not the right number"))
    }
}

// 主函数不返回值，但可能返回一个错误！
fn main() -> Result<(), String> {
    let result = do_something_that_might_fail(12);

    match result {
        Ok(v) => println!("found {}", v),
        Err(_e) => {
            // 优雅地处理错误
            
            // 返回一个说明发生了什么的新错误！
            return Err(String::from("something went wrong in main!"));
        }
    }

    // Notice we use a unit value inside a Result Ok
    // to represent everything is fine
    Ok(())
}
```$rust37$,
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
  'b2a30038-0001-4001-8001-000000000038',
  'b2a30004-0001-4001-8001-000000000104',
  '38. 优雅地错误处理',
  '`Result` 如此常见以至于 Rust 有个强大的操作符 `?` 来与之配合。',
  $rust38$`Result` 如此常见以至于 Rust 有个强大的操作符 `?` 来与之配合。
以下两个表达式是等价的：

`do_something_that_might_fail()?
`
`match do_something_that_might_fail() {
    Ok(v) => v,
    Err(e) => return Err(e),
}
`

### 示例代码

```rust
fn do_something_that_might_fail(i: i32) -> Result<f32, String> {
    if i == 42 {
        Ok(13.0)
    } else {
        Err(String::from("this is not the right number"))
    }
}

fn main() -> Result<(), String> {
    // 看看我们节省了多少代码！
    let v = do_something_that_might_fail(42)?;
    println!("found {}", v);
    Ok(())
}
```$rust38$,
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
  'b2a30039-0001-4001-8001-000000000039',
  'b2a30004-0001-4001-8001-000000000104',
  '39. 丑陋的 Option/Result 处理',
  '当你只是试图快速地写一些代码时，`Option`/`Result` 对付起来可能比较无聊。',
  $rust39$当你只是试图快速地写一些代码时，`Option`/`Result` 对付起来可能比较无聊。
`Option` 和 `Result` 都有一个名为 `unwrap` 的函数：这个函数可以简单粗暴地获取其中的值。
`unwrap` 会：

- 获取 Option/Result 内部的值

- 如果枚举的类型是 None/Err， 则会 `panic!`

这两段代码是等价的：

`my_option.unwrap()
`
`match my_option {
    Some(v) => v,
    None => panic!("some error message generated by Rust!"),
}
`
类似的：

`my_result.unwrap()
`
`match my_result {
    Ok(v) => v,
    Err(e) => panic!("some error message generated by Rust!"),
}
`
不过啊，做个好 Rustacean，正确地使用 `match`！

### 示例代码

```rust
fn do_something_that_might_fail(i: i32) -> Result<f32, String> {
    if i == 42 {
        Ok(13.0)
    } else {
        Err(String::from("this is not the right number"))
    }
}

fn main() -> Result<(), String> {
    // 简洁但假设性强，而且很快就会变得丑陋
    let v = do_something_that_might_fail(42).unwrap();
    println!("found {}", v);
    
    // 这会 panic!
    let v = do_something_that_might_fail(1).unwrap();
    println!("found {}", v);
    
    Ok(())
}
```$rust39$,
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
  'b2a30040-0001-4001-8001-000000000040',
  'b2a30004-0001-4001-8001-000000000104',
  '40. Vectors',
  '一些经常使用的泛型是集合类型。一个 vector 是可变长度的元素集合，以 `Vec` 结构表示。',
  $rust40$一些经常使用的泛型是集合类型。一个 vector 是可变长度的元素集合，以 `Vec` 结构表示。

比起手动构建，宏 `vec!` 让我们可以轻松地创建 vector。

`Vec` 有一个形如 `iter()` 的方法可以为一个 vector 创建迭代器，这允许我们可以轻松地将 vector 用到 `for` 循环中去。

内存细节：

- `Vec` 是一个结构体，但是内部其实保存了在堆上固定长度数据的引用。

- 一个 vector 开始有默认大小容量，当更多的元素被添加进来后，它会重新在堆上分配一个新的并具有更大容量的定长列表。（类似 C++ 的 vector）

### 示例代码

```rust
fn main() {
    // 我们可以显式确定类型
    let mut i32_vec = Vec::<i32>::new(); // turbofish <3
    i32_vec.push(1);
    i32_vec.push(2);
    i32_vec.push(3);

    // 但是看看 Rust 是多么聪明的自动检测类型啊
    let mut float_vec = Vec::new();
    float_vec.push(1.3);
    float_vec.push(2.3);
    float_vec.push(3.4);

    // 这是个漂亮的宏！
    let string_vec = vec![String::from("Hello"), String::from("World")];

    for word in string_vec.iter() {
        println!("{}", word);
    }
}
```$rust40$,
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
  'b2a30041-0001-4001-8001-000000000041',
  'b2a30004-0001-4001-8001-000000000104',
  '41. 第四章 - 总结',
  '在这一章中，我们了解了泛型给我们带来的强大功能！如果你还不完全知道该如何使用这一切，',
  $rust41$在这一章中，我们了解了泛型给我们带来的强大功能！如果你还不完全知道该如何使用这一切，
别担心，仅仅是了解这些将会在代码中反复出现的中心思想就足够了。我们的功能在日趋强大！
在下一章中，我们将讨论 Rust 中的一个重要概念：数据所有权。$rust41$,
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

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  'b2a30043-0001-4001-8001-000000000043',
  'b2a30005-0001-4001-8001-000000000105',
  '43. 所有权',
  '实例化一个类型并且将其**绑定**到变量名上将会创建一些内存资源，而这些内存资源将会在其整个**生命周期**中被 Rust 编译器检验。 被绑定的变量即为该资源的**所有者**。',
  $rust43$实例化一个类型并且将其**绑定**到变量名上将会创建一些内存资源，而这些内存资源将会在其整个**生命周期**中被 Rust 编译器检验。 被绑定的变量即为该资源的**所有者**。

### 示例代码

```rust
struct Foo {
    x: i32,
}

fn main() {
    // 我们实例化这个结构体并将其绑定到具体的变量上
    // 来创建内存资源
    let foo = Foo { x: 42 };
    // foo 即为该资源的所有者
}
```$rust43$,
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
  'b2a30044-0001-4001-8001-000000000044',
  'b2a30005-0001-4001-8001-000000000105',
  '44. 基于域的资源管理',
  'Rust 将使用资源最后被使用的位置或者一个函数域的结束来作为资源被析构和释放的地方。 此处析构和释放的概念被称之为 **drop**（丢弃）。',
  $rust44$Rust 将使用资源最后被使用的位置或者一个函数域的结束来作为资源被析构和释放的地方。 此处析构和释放的概念被称之为 **drop**（丢弃）。

内存细节：

- Rust 没有垃圾回收机制。

- 在 C++ 中，这被也称为“资源获取即初始化“（RAII）。

### 示例代码

```rust
struct Foo {
    x: i32,
}

fn main() {
    let foo_a = Foo { x: 42 };
    let foo_b = Foo { x: 13 };

    println!("{}", foo_a.x);
    // foo_a 将在这里被 dropped 因为其在这之后再也没有被使用

    println!("{}", foo_b.x);
    // foo_b 将在这里被 dropped 因为这是函数域的结尾
}
```$rust44$,
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
  'b2a30045-0001-4001-8001-000000000045',
  'b2a30005-0001-4001-8001-000000000105',
  '45. 释放是分级进行的',
  '删除一个结构体时，结构体本身会先被释放，紧接着才分别释放相应的子结构体并以此类推。',
  $rust45$删除一个结构体时，结构体本身会先被释放，紧接着才分别释放相应的子结构体并以此类推。

内存细节：

- Rust 通过自动释放内存来帮助确保减少内存泄漏。

- 每个内存资源仅会被释放一次。

### 示例代码

```rust
struct Bar {
    x: i32,
}

struct Foo {
    bar: Bar,
}

fn main() {
    let foo = Foo { bar: Bar { x: 42 } };
    println!("{}", foo.bar.x);
    // foo 首先被 dropped 释放
    // 紧接着是 foo.bar
}
```$rust45$,
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
  'b2a30046-0001-4001-8001-000000000046',
  'b2a30005-0001-4001-8001-000000000105',
  '46. 移交所有权',
  '将所有者作为参数传递给函数时，其所有权将移交至该函数的参数。 在一次**移动**后，原函数中的变量将无法再被使用。',
  $rust46$将所有者作为参数传递给函数时，其所有权将移交至该函数的参数。 在一次**移动**后，原函数中的变量将无法再被使用。

内存细节:

- 在**移动**期间，所有者的堆栈值将会被复制到函数调用的参数堆栈中。

### 示例代码

```rust
struct Foo {
    x: i32,
}

fn do_something(f: Foo) {
    println!("{}", f.x);
    // f 在这里被 dropped 释放
}

fn main() {
    let foo = Foo { x: 42 };
    // foo 被移交至 do_something
    do_something(foo);
    // 此后 foo 便无法再被使用
}
```$rust46$,
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
  'b2a30047-0001-4001-8001-000000000047',
  'b2a30005-0001-4001-8001-000000000105',
  '47. 归还所有权',
  '所有权也可以从一个函数中被归还。',
  $rust47$所有权也可以从一个函数中被归还。

### 示例代码

```rust
struct Foo {
    x: i32,
}

fn do_something() -> Foo {
    Foo { x: 42 }
    // 所有权被移出
}

fn main() {
    let foo = do_something();
    // foo 成为了所有者
    // foo 在函数域结尾被 dropped 释放
}
```$rust47$,
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
  'b2a30048-0001-4001-8001-000000000048',
  'b2a30005-0001-4001-8001-000000000105',
  '48. 使用引用借用所有权',
  '引用允许我们通过 `&` 操作符来借用对一个资源的访问权限。',
  $rust48$引用允许我们通过 `&` 操作符来借用对一个资源的访问权限。
引用也会如同其他资源一样被释放。

### 示例代码

```rust
struct Foo {
    x: i32,
}

fn main() {
    let foo = Foo { x: 42 };
    let f = &foo;
    println!("{}", f.x);
    // f 在这里被 dropped 释放
    // foo 在这里被 dropped 释放
}
```$rust48$,
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
  'b2a30049-0001-4001-8001-000000000049',
  'b2a30005-0001-4001-8001-000000000105',
  '49. 通过引用借用可变所有权',
  '我们也可以使用 `&mut` 操作符来借用对一个资源的可变访问权限。 在发生了可变借用后，一个资源的所有者便不可以再次被借用或者修改。',
  $rust49$我们也可以使用 `&mut` 操作符来借用对一个资源的可变访问权限。 在发生了可变借用后，一个资源的所有者便不可以再次被借用或者修改。

内存细节：

- Rust 之所以要避免同时存在两种可以改变所拥有变量值的方式，是因为此举可能会导致潜在的数据争用（data race）。

### 示例代码

```rust
struct Foo {
    x: i32,
}

fn do_something(f: Foo) {
    println!("{}", f.x);
    // f 在这里被 dropped 释放
}

fn main() {
    let mut foo = Foo { x: 42 };
    let f = &mut foo;

    // 会报错: do_something(foo);
    // 因为 foo 已经被可变借用而无法取得其所有权

    // 会报错: foo.x = 13;
    // 因为 foo 已经被可变借用而无法被修改

    f.x = 13;
    // f 会因为此后不再被使用而被 dropped 释放
    
    println!("{}", foo.x);
    
    // 现在修改可以正常进行因为其所有可变引用已经被 dropped 释放
    foo.x = 7;
    
    // 移动 foo 的所有权到一个函数中
    do_something(foo);
}
```$rust49$,
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
  'b2a30050-0001-4001-8001-000000000050',
  'b2a30005-0001-4001-8001-000000000105',
  '50. 解引用',
  '使用 `&mut` 引用时, 你可以通过 `*` 操作符来修改其指向的值。 你也可以使用 `*` 操作符来对所拥有的值进行拷贝（前提是该值可以被拷贝——我们将会在后续章节中讨论可拷贝类型）。',
  $rust50$使用 `&mut` 引用时, 你可以通过 `*` 操作符来修改其指向的值。 你也可以使用 `*` 操作符来对所拥有的值进行拷贝（前提是该值可以被拷贝——我们将会在后续章节中讨论可拷贝类型）。

### 示例代码

```rust
fn main() {
    let mut foo = 42;
    let f = &mut foo;
    let bar = *f; // 取得所有者值的拷贝
    *f = 13;      // 设置引用所有者的值
    println!("{}", bar);
    println!("{}", foo);
}
```$rust50$,
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
  'b2a30051-0001-4001-8001-000000000051',
  'b2a30005-0001-4001-8001-000000000105',
  '51. 传递借用的数据',
  'Rust 对于引用的规则也许最好用以下的方式总结：',
  $rust51$Rust 对于引用的规则也许最好用以下的方式总结：

- Rust 只允许同时存在一个可变引用**或者**多个不可变引用，**不允许可变引用和不可变引用同时存在**。

- 一个引用永远也不会比它的所有者存活得更久。

而在函数间进行引用的传递时，以上这些通常都不会成为问题。

内存细节：

- 上面的第一条规则避免了数据争用的出现。什么是数据争用？在对数据进行读取的时候，数据争用可能会因为同时存在对数据的写入而产生不同步。这一点往往会出现在多线程编程中。

- 而第二条引用规则则避免了通过引用而错误的访问到不存在的数据（在 C 语言中被称之为悬垂指针）。

### 示例代码

```rust
struct Foo {
    x: i32,
}

fn do_something(f: &mut Foo) {
    f.x += 1;
    // 可变引用 f 在这里被 dropped 释放
}

fn main() {
    let mut foo = Foo { x: 42 };
    do_something(&mut foo);
    // 因为所有的可变引用都在 do_something 函数内部被释放了
    // 此时我们便可以再创建一个
    do_something(&mut foo);
    // foo 在这里被 dropped 释放
}
```$rust51$,
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

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  'b2a30052-0001-4001-8001-000000000052',
  'b2a30005-0001-4001-8001-000000000105',
  '52. 引用的引用',
  '引用甚至也可以用在其他引用上。',
  $rust52$引用甚至也可以用在其他引用上。

### 示例代码

```rust
struct Foo {
    x: i32,
}

fn do_something(a: &Foo) -> &i32 {
    return &a.x;
}

fn main() {
    let mut foo = Foo { x: 42 };
    let x = &mut foo.x;
    *x = 13;
    // x 在这里被 dropped 释放从而允许我们再创建一个不可变引用
    let y = do_something(&foo);
    println!("{}", y);
    // y 在这里被 dropped 释放
    // foo 在这里被 dropped 释放
}
```$rust52$,
  NULL, NULL, NULL, true, false,
  9
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
  'b2a30053-0001-4001-8001-000000000053',
  'b2a30005-0001-4001-8001-000000000105',
  '53. 显式生命周期',
  '尽管 Rust 不总是在代码中将它展示出来，但编译器会理解每一个变量的生命周期并进行验证以确保一个引用不会有长于其所有者的存在时间。 同时，函数可以通过使用一些符号来参数化函数签名，以帮助界定哪些参数和返回值共享同一生命周期。 生命周期注解',
  $rust53$尽管 Rust 不总是在代码中将它展示出来，但编译器会理解每一个变量的生命周期并进行验证以确保一个引用不会有长于其所有者的存在时间。 同时，函数可以通过使用一些符号来参数化函数签名，以帮助界定哪些参数和返回值共享同一生命周期。 生命周期注解总是以 `'` 开头，例如 `'a`，`'b` 以及 `'c`。

### 示例代码

```rust
struct Foo {
    x: i32,
}

// 参数 foo 和返回值共享同一生命周期
fn do_something<'a>(foo: &'a Foo) -> &'a i32 {
    return &foo.x;
}

fn main() {
    let mut foo = Foo { x: 42 };
    let x = &mut foo.x;
    *x = 13;
    // x 在这里被 dropped 释放从而允许我们再创建一个不可变引用
    let y = do_something(&foo);
    println!("{}", y);
    // y 在这里被 dropped 释放
    // foo 在这里被 dropped 释放
}
```$rust53$,
  NULL, NULL, NULL, true, false,
  10
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
  'b2a30054-0001-4001-8001-000000000054',
  'b2a30005-0001-4001-8001-000000000105',
  '54. 多个生命周期',
  '生命周期注解可以通过区分函数签名中不同部分的生命周期，来允许我们显式地明确某些编译器靠自己无法解决的场景。',
  $rust54$生命周期注解可以通过区分函数签名中不同部分的生命周期，来允许我们显式地明确某些编译器靠自己无法解决的场景。

### 示例代码

```rust
struct Foo {
    x: i32,
}

// foo_b 和返回值共享同一生命周期
// foo_a 则拥有另一个不相关联的生命周期
fn do_something<'a, 'b>(foo_a: &'a Foo, foo_b: &'b Foo) -> &'b i32 {
    println!("{}", foo_a.x);
    println!("{}", foo_b.x);
    return &foo_b.x;
}

fn main() {
    let foo_a = Foo { x: 42 };
    let foo_b = Foo { x: 12 };
    let x = do_something(&foo_a, &foo_b);
    // foo_a 在这里被 dropped 释放因为只有 foo_b 的生命周期在此之后还在延续
    println!("{}", x);
    // x 在这里被 dropped 释放
    // foo_b 在这里被 dropped 释放
}
```$rust54$,
  NULL, NULL, NULL, true, false,
  11
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
  'b2a30055-0001-4001-8001-000000000055',
  'b2a30005-0001-4001-8001-000000000105',
  '55. 静态生命周期',
  '一个**静态**变量是一个在编译期间即被创建并存在于整个程序始末的内存资源。他们必须被明确指定类型。 一个**静态生命周期**是指一段内存资源无限期地延续到程序结束。需要注意的一点是，在此定义之下，一些静态生命周期的资源也可以在运行时被创建',
  $rust55$一个**静态**变量是一个在编译期间即被创建并存在于整个程序始末的内存资源。他们必须被明确指定类型。 一个**静态生命周期**是指一段内存资源无限期地延续到程序结束。需要注意的一点是，在此定义之下，一些静态生命周期的资源也可以在运行时被创建。 拥有静态生命周期的资源会拥有一个特殊的生命周期注解 `'static`。 `'static` 资源永远也不会被 **drop** 释放。 如果静态生命周期资源包含了引用，那么这些引用的生命周期也一定是 `'static` 的。（任何缺少了此注解的引用都不会达到同样长的存活时间）

内存细节：

- 因为静态变量可以全局性地被任何人访问读取而潜在地引入数据争用，所以修改它具有内在的危险性。我们会在稍后讨论使用全局数据的一些挑战。

- Rust 允许使用 `unsafe { ... }` 代码块来进行一些无法被编译器担保的内存操作。The R̸͉̟͈͔̄͛̾̇͜U̶͓͖͋̅Ṡ̴͉͇̃̉̀T̵̻̻͔̟͉́͆Ơ̷̥̟̳̓͝N̶̨̼̹̲͛Ö̵̝͉̖̏̾̔M̶̡̠̺̠̐͜Î̷̛͓̣̃̐̏C̸̥̤̭̏͛̎͜O̶̧͚͖͔̊͗̇͠N̸͇̰̏̏̽̃（常见的中文翻译为：Rust 死灵书）在讨论时应该被严肃地看待，

### 示例代码

```rust
static PI: f64 = 3.1415;

fn main() {
    // 静态变量的范围也可以被限制在一个函数内
    static mut SECRET: &'static str = "swordfish";

    // 字符串字面值拥有 'static 生命周期
    let msg: &'static str = "Hello World!";
    let p: &'static f64 = &PI;
    println!("{} {}", msg, p);

    // 你可以打破一些规则，但是必须是显式地
    unsafe {
        // 我们可以修改 SECRET 到一个字符串字面值因为其同样是 'static 的
        SECRET = "abracadabra";
        println!("{}", SECRET);
    }
}
```$rust55$,
  NULL, NULL, NULL, true, false,
  12
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
  'b2a30056-0001-4001-8001-000000000056',
  'b2a30005-0001-4001-8001-000000000105',
  '56. 数据类型中的生命周期',
  '和函数相同，数据类型也可以用生命周期注解来参数化其成员。 Rust 会验证引用所包含的数据结构永远也不会比引用指向的所有者存活周期更长。 我们不能在运行中拥有一个包括指向虚无的引用结构存在！',
  $rust56$和函数相同，数据类型也可以用生命周期注解来参数化其成员。 Rust 会验证引用所包含的数据结构永远也不会比引用指向的所有者存活周期更长。 我们不能在运行中拥有一个包括指向虚无的引用结构存在！

### 示例代码

```rust
struct Foo<'a> {
    i:&'a i32
}

fn main() {
    let x = 42;
    let foo = Foo {
        i: &x
    };
    println!("{}",foo.i);
}
```$rust56$,
  NULL, NULL, NULL, true, false,
  13
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
  'b2a30057-0001-4001-8001-000000000057',
  'b2a30005-0001-4001-8001-000000000105',
  '57. 第五章 - 总结',
  '哇，恭喜您成功走完了本章！我知道这下可能会有很多需要吸收的东西，但是您已经在成为一名 Rustacean 的路上走得很好了。希望您能愈发清晰地认识到 Rust 是如何致力于解决系统编程中的诸多常见挑战：',
  $rust57$哇，恭喜您成功走完了本章！我知道这下可能会有很多需要吸收的东西，但是您已经在成为一名 Rustacean 的路上走得很好了。希望您能愈发清晰地认识到 Rust 是如何致力于解决系统编程中的诸多常见挑战：

- 无意间对资源的修改

- 忘记及时地释放资源

- 资源意外地被释放两次

- 在资源被释放后使用了它

- 由于读取数据的同时有其他人正在向资源中写入数据而引起的数据争用

- 在编译器无法做担保时，清晰看到代码的作用域

在下一章中，我们会研究一些 Rust 如何处理文本的相关知识。$rust57$,
  NULL, NULL, NULL, true, false,
  14
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
  'b2a30059-0001-4001-8001-000000000059',
  'b2a30006-0001-4001-8001-000000000106',
  '59. 字符串常量（String Literals）',
  '字符串常量（String Literals）采用 Unicode 编码（注：下文提及的 **utf-8** 为 Unicode 的一部分）。',
  $rust59$字符串常量（String Literals）采用 Unicode 编码（注：下文提及的 **utf-8** 为 Unicode 的一部分）。

字符串常量的类型为 `&'static str`：

- `&` 意味着该变量为对内存中数据的引用，没有使用 `&mut` 代表编译器将不会允许对该变量的修改

- `'static` 意味着字符串数据将会一直保存到程序结束（它不会在程序运行期间被**释放（drop）**）

- `str` 意味着该变量总是指向一串合法的 **utf-8** 字节序列。

内存细节：

- Rust 编译器可能会将字符串储存在程序内存的数据段中。

### 示例代码

```rust
fn main() {
    let a: &'static str = "你好 🦀";
    println!("{} {}", a, a.len());
}
```$rust59$,
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
  'b2a30060-0001-4001-8001-000000000060',
  'b2a30006-0001-4001-8001-000000000106',
  '60. 什么是 utf-8',
  '随着在计算机上使用的语言增加，需要一个能比 ASCII 编码（1 字节表示 1 个字符，总共可表示 256 个字符）表示更多字符的编码来容纳其它语言的字符。',
  $rust60$随着在计算机上使用的语言增加，需要一个能比 ASCII 编码（1 字节表示 1 个字符，总共可表示 256 个字符）表示更多字符的编码来容纳其它语言的字符。

**utf-8** 编码这时被引入来解决这个问题，它用 1-4 个字节来表示 1 个字符，这使得可以表示的字符数大大增加。

使用可变长度的字节来表示字符有一个优点，就是常见的 ASCII 编码字符在 **utf-8** 编码中无需使用更多的字节（也是 1 字节表示 1 个字符）。

但是这样做也有缺点，在 **utf-8** 文本中通过索引来匹配字符（例：`my_text[3]` 获取 my_text 的第 4 个字符）将不能像以前的编码标准那么快（以前编码标准花费 **O(1)** 常数时间）。 这是因为前面的字符具有可变的对应字节，从而无法直接确定第 4 个字符在字节序列中的起始字节。

我们需要遍历 **utf-8** 的字节序列才可以得到对应 Unicode 字符的起始位置（这将花费 **O(n)** 线性时间）。

Ferris：“我只是为 **utf-8** 编码有表示我水中好友的表情符号感到高兴。“

🐠🐙🐟🐬🐋$rust60$,
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
  'b2a30061-0001-4001-8001-000000000061',
  'b2a30006-0001-4001-8001-000000000106',
  '61. 转义字符',
  '有些字符难以使用可视字符表示，这时可通过**转义字符**来表示这些字符。',
  $rust61$有些字符难以使用可视字符表示，这时可通过**转义字符**来表示这些字符。

Rust 支持类 C 语言中的常见转义字符；

- `\n` - 换行符

- `\r` - 回车符（回到本行起始位置）

- `\t` - 水平制表符（即键盘 Tab 键）

- `\\` - 代表单个反斜杠 \

- `\0` - 空字符（null）

- `\'` - 代表单引号 '

完整的转义字符表在这。

### 示例代码

```rust
fn main() {
    let a: &'static str = "Ferris 说：\t\"你好\"";
    println!("{}",a);
}
```$rust61$,
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
  'b2a30062-0001-4001-8001-000000000062',
  'b2a30006-0001-4001-8001-000000000106',
  '62. 多行字符串常量',
  'Rust 中字符串默认支持分行。',
  $rust62$Rust 中字符串默认支持分行。

使用 `\` 可以使多行字符串不换行。

### 示例代码

```rust
fn main() {
    let haiku: &'static str = "
        我写下，擦掉，
        再写，再擦，
        然后一朵罂粟花开了。
        - 葛饰北斋";
    println!("{}", haiku);
    
    
    println!("你好 \
    世界"); // 注意11行 世 字前面的空格会被忽略
}
```$rust62$,
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
  'b2a30063-0001-4001-8001-000000000063',
  'b2a30006-0001-4001-8001-000000000106',
  '63. 原始字符串常量',
  '原始字符串支持写入原始的文本而无需为特殊字符转义，因而不会导致可读性下降（如双引号与反斜杠无需写为 `\"` 和 `\\`），只需以 `r#"` 开头，以 `"#` 结尾。',
  $rust63$原始字符串支持写入原始的文本而无需为特殊字符转义，因而不会导致可读性下降（如双引号与反斜杠无需写为 `\"` 和 `\\`），只需以 `r#"` 开头，以 `"#` 结尾。

### 示例代码

```rust
fn main() {
    let a: &'static str = r#"
        <div class="advice">
            原始字符串在一些情景下非常有用。
        </div>
        "#;
    println!("{}", a);
}
```$rust63$,
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
  'b2a30064-0001-4001-8001-000000000064',
  'b2a30006-0001-4001-8001-000000000106',
  '64. 文件中的字符串常量',
  '如果你需要使用大量文本，可以尝试用宏 `include_str!` 来从本地文件中导入文本到程序中：',
  $rust64$如果你需要使用大量文本，可以尝试用宏 `include_str!` 来从本地文件中导入文本到程序中：

```rust
let hello_html = include_str!("hello.html");
```$rust64$,
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
  'b2a30065-0001-4001-8001-000000000065',
  'b2a30006-0001-4001-8001-000000000106',
  '65. 字符串片段（String Slice）',
  '字符串片段是对内存中字节序列的引用，而且这段字节序列必须是合法的 utf-8 字节序列。',
  $rust65$字符串片段是对内存中字节序列的引用，而且这段字节序列必须是合法的 utf-8 字节序列。

`str` 片段的字符串片段（子片段），也必须是合法的 utf-8 字节序列。

`&str` 的常用方法：

- `len` 获取字符串常量的字节长度（不是字符长度）。

- `starts_with`/`ends_with` 用于基础测试。

- `is_empty` 长度为 0 时返回 true。

- `find` 返回 `Option<usize>`，其中的 `usize` 为匹配到的第一个对应文本的索引值。

### 示例代码

```rust
fn main() {
    let a = "你好 🦀";
    println!("{}", a.len());
    let first_word = &a[0..6];
    let second_word = &a[7..11];
    // let half_crab = &a[7..9]; 报错
    // Rust 不接受无效 unicode 字符构成的片段
    println!("{} {}", first_word, second_word);
}
```$rust65$,
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
  'b2a30066-0001-4001-8001-000000000066',
  'b2a30006-0001-4001-8001-000000000106',
  '66. Char',
  '为了解决使用 Unicode 带来的麻烦，Rust 提供了将 utf-8 字节序列转化为类型 `char` 的 vector 的方法。',
  $rust66$为了解决使用 Unicode 带来的麻烦，Rust 提供了将 utf-8 字节序列转化为类型 `char` 的 vector 的方法。

每个 `char` 长度都为 4 字节（可提高字符查找的效率）。

### 示例代码

```rust
fn main() {
    // 收集字符并转换为类型为 char 的 vector
    let chars = "你好 🦀".chars().collect::<Vec<char>>();
    println!("{}", chars.len()); // 结果应为 4
    // 由于 char 为 4 字节长，我们可以将其转化为 u32
    println!("{}", chars[3] as u32);
}
```$rust66$,
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
  'b2a30067-0001-4001-8001-000000000067',
  'b2a30006-0001-4001-8001-000000000106',
  '67. 字符串（String）',
  '**字符串`String`** 是一个结构体，其持有以堆（heap）的形式在内存中存储的 utf-8 字节序列。',
  $rust67$**字符串`String`** 是一个结构体，其持有以堆（heap）的形式在内存中存储的 utf-8 字节序列。

由于它以堆的形式来存储，字符串可以延长、修改等等。这些都是字符串常量（string literals）无法执行的操作。

常用方法：

- `push_str` 用于在字符串的结尾添加字符串常量（&str）。

- `replace` 用于将一段字符串替换为其它的。

- `to_lowercase`/`to_uppercase` 用于大小写转换。

- `trim` 用于去除字符串前后的空格。

如果字符串`String` 被释放（drop）了，其对应的堆内存片段也将被释放。

字符串`String` 可以使用 `+` 运算符来在其结尾处连接一个 `&str` 并将其自身返回。但这个方法可能并不像你想象中的那么人性化。

### 示例代码

```rust
fn main() {
    let mut helloworld = String::from("你好");
    helloworld.push_str(" 世界");
    helloworld = helloworld + "!";
    println!("{}", helloworld);
}
```$rust67$,
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

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  'b2a30068-0001-4001-8001-000000000068',
  'b2a30006-0001-4001-8001-000000000106',
  '68. 将文本作为函数的参数',
  '字符串常量（String literals）和字符串（String）一般以字符串片段（string slice）的形式传递给函数。这给许多场景提供了充足的灵活性，因为所有权并未被传递。',
  $rust68$字符串常量（String literals）和字符串（String）一般以字符串片段（string slice）的形式传递给函数。这给许多场景提供了充足的灵活性，因为所有权并未被传递。

### 示例代码

```rust
fn say_it_loud(msg:&str){
    println!("{}！！！",msg.to_string().to_uppercase());
}

fn main() {
    // say_it_loud can borrow &'static str as a &str
    say_it_loud("你好");
    // say_it_loud can also borrow String as a &str
    say_it_loud(&String::from("再见"));
}
```$rust68$,
  NULL, NULL, NULL, true, false,
  9
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
  'b2a30069-0001-4001-8001-000000000069',
  'b2a30006-0001-4001-8001-000000000106',
  '69. 字符串构建',
  '`concat` 和 `join` 可以以简洁而有效的方式构建字符串。',
  $rust69$`concat` 和 `join` 可以以简洁而有效的方式构建字符串。

### 示例代码

```rust
fn main() {
    let helloworld = ["你好", " ", "世界", "！"].concat();
    let abc = ["a", "b", "c"].join(",");
    println!("{}", helloworld);
    println!("{}",abc);
}
```$rust69$,
  NULL, NULL, NULL, true, false,
  10
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
  'b2a30070-0001-4001-8001-000000000070',
  'b2a30006-0001-4001-8001-000000000106',
  '70. 字符串格式化',
  '宏 `format!` 可用于创建一个使用占位符的参数化字符串。（例：`{}`）',
  $rust70$宏 `format!` 可用于创建一个使用占位符的参数化字符串。（例：`{}`）

`format!` 和 `println!` 生成的参数化字符串相同，只是 `format!` 将其返回而 `println!` 将其打印出来。

这个函数涉及的内容太过广泛，因而不可能在 *Rust 语言之旅* 中详细介绍，  如需了解完整的内容可看这里。

### 示例代码

```rust
fn main() {
    let a = 42;
    let f = format!("生活诀窍: {}",a);
    println!("{}",f);
}
```$rust70$,
  NULL, NULL, NULL, true, false,
  11
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
  'b2a30071-0001-4001-8001-000000000071',
  'b2a30006-0001-4001-8001-000000000106',
  '71. 字符串转换',
  '许多类型都可以通过 `to_string` 转换为字符串。',
  $rust71$许多类型都可以通过 `to_string` 转换为字符串。

而泛型函数 `parse` 则可将字符串或是字符串常量转换为其它类型，该函数会返回 `Result` 因为转换有可能失败。

### 示例代码

```rust
fn main() -> Result<(), std::num::ParseIntError> {
    let a = 42;
    let a_string = a.to_string();
    let b = a_string.parse::<i32>()?;
    println!("{} {}", a, b);
    Ok(())
}
```$rust71$,
  NULL, NULL, NULL, true, false,
  12
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
  'b2a30072-0001-4001-8001-000000000072',
  'b2a30006-0001-4001-8001-000000000106',
  '72. 第六章 - 总结',
  '现在你已经懂得 Rust 中文本的基础了！正如你所见，Unicode 编码的应用使文本相关操作有些棘手，但标准库中丰富的功能弥补了这一缺陷。',
  $rust72$现在你已经懂得 Rust 中文本的基础了！正如你所见，Unicode 编码的应用使文本相关操作有些棘手，但标准库中丰富的功能弥补了这一缺陷。

到目前为止，我们主要是从程序化范式的角度来看待 Rust（即只是函数和数据），但现在是时候让我们来了解一些 Rust 的面向对象范式的特性和能力了。$rust72$,
  NULL, NULL, NULL, true, false,
  13
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
  'b2a30074-0001-4001-8001-000000000074',
  'b2a30007-0001-4001-8001-000000000107',
  '74. 什么是 OOP？',
  '面向对象编程大致是指具有如下一些标志性特征的编程语言：',
  $rust74$面向对象编程大致是指具有如下一些标志性特征的编程语言：

- 封装——将数据和函数关联到单一类型的概念单元中，称为*对象*。

- 抽象——将数据和函数成员隐藏起来，以隐藏对象的实现细节。

- 多态——从不同的功能角度与对象进行交互的能力。

- 继承——从其他对象继承数据和行为的能力。$rust74$,
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
  'b2a30075-0001-4001-8001-000000000075',
  'b2a30007-0001-4001-8001-000000000107',
  '75. Rust 不是 OOP',
  'Rust 缺乏任何有意义的数据和行为的继承。',
  $rust75$Rust 缺乏任何有意义的数据和行为的继承。

- 结构体不能从父结构继承字段。

- 结构体不能从父结构继承函数。

尽管如此，Rust 实现了许多编程语言的特性，所以你可能不会在意这个缺失。$rust75$,
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
  'b2a30076-0001-4001-8001-000000000076',
  'b2a30007-0001-4001-8001-000000000107',
  '76. 使用方法进行封装',
  'Rust 支持*对象*的概念。“对象”是一个与一些函数（也称为*方法*）相关联的结构体。',
  $rust76$Rust 支持*对象*的概念。“对象”是一个与一些函数（也称为*方法*）相关联的结构体。

任何方法的第一个参数必须是与方法调用相关联的实例的引用。(例如 `instanceOfObj.foo()`)。Rust 使用：

- `&self` —— 对实例的不可变引用。

- `&mut self` —— 对实例的可变引用。

方法是在一个有 `impl` 关键字的实现块中定义的：

```rust
impl MyStruct { 
    ...
    fn foo(&self) {
        ...
    }
}
```

### 示例代码

```rust
struct SeaCreature {
    noise: String,
}

impl SeaCreature {
    fn get_sound(&self) -> &str {
        &self.noise
    }
}

fn main() {
    let creature = SeaCreature {
        noise: String::from("blub"),
    };
    println!("{}", creature.get_sound());
}
```$rust76$,
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
  'b2a30077-0001-4001-8001-000000000077',
  'b2a30007-0001-4001-8001-000000000107',
  '77. 抽象与选择性暴露',
  'Rust 可以隐藏对象的内部实现细节。',
  $rust77$Rust 可以隐藏对象的内部实现细节。

默认情况下，字段和方法只有它们所属的模块才可访问。

`pub` 关键字可以将字段和方法暴露给模块外的访问者。

### 示例代码

```rust
struct SeaCreature {
    pub name: String,
    noise: String,
}

impl SeaCreature {
    pub fn get_sound(&self) -> &str {
        &self.noise
    }
}

fn main() {
    let creature = SeaCreature {
        name: String::from("Ferris"),
        noise: String::from("blub"),
    };
    println!("{}", creature.get_sound());
}
```$rust77$,
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
  'b2a30078-0001-4001-8001-000000000078',
  'b2a30007-0001-4001-8001-000000000107',
  '78. 使用 Trait 实现多态',
  'Rust 支持多态的特性。Trait 允许我们将一组方法与结构类型关联起来。',
  $rust78$Rust 支持多态的特性。Trait 允许我们将一组方法与结构类型关联起来。

我们首先在 Trait 里面定义函数签名：

`trait MyTrait {
    fn foo(&self);
    ...
}
`
当一个结构体实现一个 trait 时，它便建立了一个契约，允许我们通过 trait 类型与结构体进行间接交互（例如 `&dyn MyTrait`），而不必知道其真实的类型。

结构体实现 Trait 方法是在实现块中定义要实现的方法：

```rust
impl MyTrait for MyStruct { 
    fn foo(&self) {
        ...
    }
    ... 
}
```

### 示例代码

```rust
struct SeaCreature {
    pub name: String,
    noise: String,
}

impl SeaCreature {
    pub fn get_sound(&self) -> &str {
        &self.noise
    }
}

trait NoiseMaker {
    fn make_noise(&self);
}

impl NoiseMaker for SeaCreature {
    fn make_noise(&self) {
        println!("{}", &self.get_sound());
    }
}

fn main() {
    let creature = SeaCreature {
        name: String::from("Ferris"),
        noise: String::from("blub"),
    };
    creature.make_noise();
}
```$rust78$,
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
  'b2a30079-0001-4001-8001-000000000079',
  'b2a30007-0001-4001-8001-000000000107',
  '79. Trait 自带方法',
  'Trait 可以有已实现的方法。',
  $rust79$Trait 可以有已实现的方法。

这些函数并不能直接访问结构体的内部字段，但它可以在许多 trait 实现者之间共享行为。

### 示例代码

```rust
struct SeaCreature {
    pub name: String,
    noise: String,
}

impl SeaCreature {
    pub fn get_sound(&self) -> &str {
        &self.noise
    }
}

trait NoiseMaker {
    fn make_noise(&self);
    
    fn make_alot_of_noise(&self){
        self.make_noise();
        self.make_noise();
        self.make_noise();
    }
}

impl NoiseMaker for SeaCreature {
    fn make_noise(&self) {
        println!("{}", &self.get_sound());
    }
}

fn main() {
    let creature = SeaCreature {
        name: String::from("Ferris"),
        noise: String::from("blub"),
    };
    creature.make_alot_of_noise();
}
```$rust79$,
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
  'b2a30080-0001-4001-8001-000000000080',
  'b2a30007-0001-4001-8001-000000000107',
  '80. Trait 继承',
  'Traits 可以从其他 trait 继承方法。',
  $rust80$Traits 可以从其他 trait 继承方法。

### 示例代码

```rust
struct SeaCreature {
    pub name: String,
    noise: String,
}

impl SeaCreature {
    pub fn get_sound(&self) -> &str {
        &self.noise
    }
}

trait NoiseMaker {
    fn make_noise(&self);
}

trait LoudNoiseMaker: NoiseMaker {
    fn make_alot_of_noise(&self) {
        self.make_noise();
        self.make_noise();
        self.make_noise();
    }
}

impl NoiseMaker for SeaCreature {
    fn make_noise(&self) {
        println!("{}", &self.get_sound());
    }
}

impl LoudNoiseMaker for SeaCreature {}

fn main() {
    let creature = SeaCreature {
        name: String::from("Ferris"),
        noise: String::from("blub"),
    };
    creature.make_alot_of_noise();
}
```$rust80$,
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
  'b2a30081-0001-4001-8001-000000000081',
  'b2a30007-0001-4001-8001-000000000107',
  '81. 动态调度和静态调度',
  '方法的执行有两种方式：',
  $rust81$方法的执行有两种方式：

- 静态调度——当实例类型已知时，我们直接知道要调用什么函数。

- 动态调度——当实例类型未知时，我们必须想方法来调用正确的函数。

Trait 类型 `&dyn MyTrait` 给我们提供了使用动态调度间接处理对象实例的能力。

当使用动态调度时，Rust 会鼓励你在你的 trait 类型前加上`dyn`，以便其他人知道你在做什么。

内存细节：

- 动态调度的速度稍慢，因为要追寻指针以找到真正的函数调用。

### 示例代码

```rust
struct SeaCreature {
    pub name: String,
    noise: String,
}

impl SeaCreature {
    pub fn get_sound(&self) -> &str {
        &self.noise
    }
}

trait NoiseMaker {
    fn make_noise(&self);
}

impl NoiseMaker for SeaCreature {
    fn make_noise(&self) {
        println!("{}", &self.get_sound());
    }
}

fn static_make_noise(creature: &SeaCreature) {
    // 我们知道真实类型
    creature.make_noise();
}

fn dynamic_make_noise(noise_maker: &dyn NoiseMaker) {
    // 我们不知道真实类型
    noise_maker.make_noise();
}

fn main() {
    let creature = SeaCreature {
        name: String::from("Ferris"),
        noise: String::from("咕噜"),
    };
    static_make_noise(&creature);
    dynamic_make_noise(&creature);
}
```$rust81$,
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
  'b2a30082-0001-4001-8001-000000000082',
  'b2a30007-0001-4001-8001-000000000107',
  '82. Trait 对象',
  '当我们将一个对象的实例传递给类型为 `&dyn MyTrait` 的参数时，我们传递的是所谓的 *trait 对象*。',
  $rust82$当我们将一个对象的实例传递给类型为 `&dyn MyTrait` 的参数时，我们传递的是所谓的 *trait 对象*。

Trait 对象允许我们间接调用一个实例的正确方法。一个 trait 对象对应一个结构。 它保存着我们实例的指针，并保有一个指向我们实例方法的函数指针列表。

内存细节：

- 这个函数列表在 C++ 中被称为 *vtable*。$rust82$,
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

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  'b2a30083-0001-4001-8001-000000000083',
  'b2a30007-0001-4001-8001-000000000107',
  '83. 处理未知大小的数据',
  '当我们想把 Trait 存储在另一个结构中时，它们亦带来了一个有趣的挑战。 Trait 混淆了原始结构，因此它也混淆了原来的结构体的大小。在 Rust 中，在结构体中存储未知大小的值有两种处理方式。',
  $rust83$当我们想把 Trait 存储在另一个结构中时，它们亦带来了一个有趣的挑战。 Trait 混淆了原始结构，因此它也混淆了原来的结构体的大小。在 Rust 中，在结构体中存储未知大小的值有两种处理方式。

- `泛型（generics）`——使用参数化类型创建已知类型的结构/函数，因此大小变成已知的。

- `间接存储（indirection）`——将实例放在堆上，给我们提供了一个间接的层次，让我们不必担心实际类型的大小，只需存储一个指向它的指针。不过还有其他方法！$rust83$,
  NULL, NULL, NULL, true, false,
  9
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
  'b2a30084-0001-4001-8001-000000000084',
  'b2a30007-0001-4001-8001-000000000107',
  '84. 泛型函数',
  'Rust中的泛型与 Trait 是相辅相成的。 当我们描述一个参数化类型 `T` 时，我们可以通过列出参数必须实现的 Trait 来限制哪些类型可以作为参数使用。',
  $rust84$Rust中的泛型与 Trait 是相辅相成的。 当我们描述一个参数化类型 `T` 时，我们可以通过列出参数必须实现的 Trait 来限制哪些类型可以作为参数使用。

在以下例子中，类型 `T` 必须实现 `Foo` 这个 Trait：

```rust
fn my_function(foo: T)
where
    T:Foo
{
    ...
}
```

通过使用泛型，我们在编译时创建静态类型的函数，这些函数有已知的类型和大小，允许我们对其执行静态调度，并存储为有已知大小的值。

### 示例代码

```rust
struct SeaCreature {
    pub name: String,
    noise: String,
}

impl SeaCreature {
    pub fn get_sound(&self) -> &str {
        &self.noise
    }
}

trait NoiseMaker {
    fn make_noise(&self);
}

impl NoiseMaker for SeaCreature {
    fn make_noise(&self) {
        println!("{}", &self.get_sound());
    }
}

fn generic_make_noise<T>(creature: &T)
where
    T: NoiseMaker,
{
    // 我们在编译期就已经知道其真实类型
    creature.make_noise();
}

fn main() {
    let creature = SeaCreature {
        name: String::from("Ferris"),
        noise: String::from("咕噜"),
    };
    generic_make_noise(&creature);
}
```$rust84$,
  NULL, NULL, NULL, true, false,
  10
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
  'b2a30085-0001-4001-8001-000000000085',
  'b2a30007-0001-4001-8001-000000000107',
  '85. 泛型函数简写',
  'Rust 为由 Trait 限制的泛型函数提供了简写形式：',
  $rust85$Rust 为由 Trait 限制的泛型函数提供了简写形式：

```rust
fn my_function(foo: impl Foo) {
    ...
}
```

这段代码等价于：

```rust
fn my_function(foo: T)
where
    T:Foo
{
    ...
}
```

### 示例代码

```rust
struct SeaCreature {
    pub name: String,
    noise: String,
}

impl SeaCreature {
    pub fn get_sound(&self) -> &str {
        &self.noise
    }
}

trait NoiseMaker {
    fn make_noise(&self);
}

impl NoiseMaker for SeaCreature {
    fn make_noise(&self) {
        println!("{}", &self.get_sound());
    }
}

fn generic_make_noise(creature: &impl NoiseMaker)
{
    // 我们在编译期就已经知道其真实类型
    creature.make_noise();
}

fn main() {
    let creature = SeaCreature {
        name: String::from("Ferris"),
        noise: String::from("咕噜"),
    };
    generic_make_noise(&creature);
}
```$rust85$,
  NULL, NULL, NULL, true, false,
  11
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
  'b2a30086-0001-4001-8001-000000000086',
  'b2a30007-0001-4001-8001-000000000107',
  '86. Box',
  '`Box` 是一个允许我们将数据从栈上移到堆上的数据结构。',
  $rust86$`Box` 是一个允许我们将数据从栈上移到堆上的数据结构。

`Box` 是一个被称为*智能指针*的结构，它持有指向我们在堆上的数据的指针。

由于 `Box` 是一个已知大小的结构体（因为它只是持有一个指针）， 因此它经常被用在一个必须知道其字段大小的结构体中存储对某个目标的引用。

`Box` 非常常见，它几乎可以被用在任何地方：

```rust
Box::new(Foo { ... })
```

### 示例代码

```rust
struct SeaCreature {
    pub name: String,
    noise: String,
}

impl SeaCreature {
    pub fn get_sound(&self) -> &str {
        &self.noise
    }
}

trait NoiseMaker {
    fn make_noise(&self);
}

impl NoiseMaker for SeaCreature {
    fn make_noise(&self) {
        println!("{}", &self.get_sound());
    }
}

struct Ocean {
    animals: Vec<Box<dyn NoiseMaker>>,
}

fn main() {
    let ferris = SeaCreature {
        name: String::from("Ferris"),
        noise: String::from("咕噜"),
    };
    let sarah = SeaCreature {
        name: String::from("Sarah"),
        noise: String::from("哧溜"),
    };
    let ocean = Ocean {
        animals: vec![Box::new(ferris), Box::new(sarah)],
    };
    for a in ocean.animals.iter() {
        a.make_noise();
    }
}
```$rust86$,
  NULL, NULL, NULL, true, false,
  12
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
  'b2a30087-0001-4001-8001-000000000087',
  'b2a30007-0001-4001-8001-000000000107',
  '87. 重温泛型结构体',
  '泛型结构体也可以通过 Trait 来约束其参数化类型：',
  $rust87$泛型结构体也可以通过 Trait 来约束其参数化类型：

```rust
struct MyStruct
where
    T: MyTrait
{
    foo: T
    ...
}
```

泛型结构体在它的实现块中有其参数化的类型：

```rust
impl MyStruct {
    ...
}
```$rust87$,
  NULL, NULL, NULL, true, false,
  13
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
  'b2a30088-0001-4001-8001-000000000088',
  'b2a30007-0001-4001-8001-000000000107',
  '88. 第七章 - 总结',
  '现在我们手头有了更多可以清晰地表达我们的想法的语言功能！ ',
  $rust88$现在我们手头有了更多可以清晰地表达我们的想法的语言功能！ 
Rust 的抽象可能很简单，但它们强大到足以让我们写代码写得很愉快。 在本章中，我们通过 `Box` 简单瞥见了智能指针。在下一章中，我们将了解智能指针如何帮助我们处理其他特定的内存情况。

其他资源（英文）：

- 视频 - Object-oriented Programming in 7 minutes

- 文章 - "The faster you unlearn OOP, the better for you and your software"$rust88$,
  NULL, NULL, NULL, true, false,
  14
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
  'b2a30090-0001-4001-8001-000000000090',
  'b2a30008-0001-4001-8001-000000000108',
  '90. 重温引用',
  '引用本质上只是表示内存中某些字节起始位置的数字。 它唯一的目的就是表示特定类型的数据存在于何处。 引用与数字的不同之处在于，Rust 将验证引用自身的生命周期不会超过它指向的内容（否则我们在使用它时会出错！）。',
  $rust90$引用本质上只是表示内存中某些字节起始位置的数字。 它唯一的目的就是表示特定类型的数据存在于何处。 引用与数字的不同之处在于，Rust 将验证引用自身的生命周期不会超过它指向的内容（否则我们在使用它时会出错！）。$rust90$,
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
  'b2a30091-0001-4001-8001-000000000091',
  'b2a30008-0001-4001-8001-000000000108',
  '91. 指针',
  '引用可以转换成一个更原始的类型，指针(raw pointer)。 像数字一样，它可以不受限制地复制和传递，但是Rust 不保证它指向的内存位置的有效性。',
  $rust91$引用可以转换成一个更原始的类型，指针(raw pointer)。 像数字一样，它可以不受限制地复制和传递，但是Rust 不保证它指向的内存位置的有效性。
有两种指针类型：

- `*const T` - 指向永远不会改变的 T 类型数据的指针。

- `*mut T` - 指向可以更改的 T 类型数据的指针。

指针可以与数字相互转换（例如`usize`）。

指针可以使用 *unsafe* 代码访问数据（稍后会详细介绍）。

内存细节：

- Rust中的引用在用法上与 C 中的指针非常相似，但在如何存储和传递给其他函数上有更多的编译时间限制。

- Rust中的指针类似于 C 中的指针，它表示一个可以复制或传递的数字，甚至可以转换为数字类型，可以将其修改为数字以进行指针数学运算。

### 示例代码

```rust
fn main() {
    let a = 42;
    let memory_location = &a as *const i32 as usize;
    println!("Data is here {}", memory_location);
}
```$rust91$,
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
  'b2a30092-0001-4001-8001-000000000092',
  'b2a30008-0001-4001-8001-000000000108',
  '92. 解引用',
  '访问或操作 由*引用*（例如`&i32`）指向的数据的过程称为*解除引用*。',
  $rust92$访问或操作 由*引用*（例如`&i32`）指向的数据的过程称为*解除引用*。

有两种方式通过引用来访问或操作数据：

- 在变量赋值期间访问引用的数据。

- 访问引用数据的字段或方法。

Rust 有一些强大的运算符可以让我们做到这一点。$rust92$,
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
  'b2a30093-0001-4001-8001-000000000093',
  'b2a30008-0001-4001-8001-000000000108',
  '93. 运算符 *',
  '`*` 运算符是一种很明确的解引用的方法。',
  $rust93$`*` 运算符是一种很明确的解引用的方法。

```rust
let a: i32 = 42;
let ref_ref_ref_a: &&&i32 = &&&a;
let ref_a: &i32 = **ref_ref_ref_a;
let b: i32 = *ref_a;
```

内存细节:

- 因为 i32 是实现了 `Copy` 特性的原始类型，堆栈上变量 `a` 的字节被复制到变量 `b` 的字节中。

### 示例代码

```rust
fn main() {
    let a: i32 = 42;
    let ref_ref_ref_a: &&&i32 = &&&a;
    let ref_a: &i32 = **ref_ref_ref_a;
    let b: i32 = *ref_a;
    println!("{}", b)
}
```$rust93$,
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
  'b2a30094-0001-4001-8001-000000000094',
  'b2a30008-0001-4001-8001-000000000108',
  '94. 运算符 .',
  '`.`运算符用于访问引用的字段和方法，它的工作原理更加巧妙。',
  $rust94$`.`运算符用于访问引用的字段和方法，它的工作原理更加巧妙。

```rust
let f = Foo { value: 42 };
let ref_ref_ref_f = &&&f;
println!("{}", ref_ref_ref_f.value);
```

哇，为什么我们不需要在`ref_ref_ref_f`之前添加`***`？这是因为 `.` 运算符会做一些列自动解引用操作。 最后一行由编译器自动转换为以下内容。

```rust
println!("{}", (***ref_ref_ref_f).value);
```

### 示例代码

```rust
struct Foo {
    value: i32
}

fn main() {
    let f = Foo { value: 42 };
    let ref_ref_ref_f = &&&f;
    println!("{}", ref_ref_ref_f.value);
}
```$rust94$,
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
  'b2a30095-0001-4001-8001-000000000095',
  'b2a30008-0001-4001-8001-000000000108',
  '95. 智能指针',
  '除了能够使用`&`运算符创建对现有类型数据的引用之外, Rust 给我们提供了能够创建称为*智能指针*的*类引用*结构。',
  $rust95$除了能够使用`&`运算符创建对现有类型数据的引用之外, Rust 给我们提供了能够创建称为*智能指针*的*类引用*结构。

我们可以在高层次上将引用视为一种类型，它使我们能够访问另一种类型.  智能指针的行为与普通引用不同，因为它们基于程序员编写的内部逻辑进行操作.  作为程序员的你就是*智能*的一部分。

通常，智能指针实现了 `Deref`、`DerefMut` 和 `Drop` 特征，以指定当使用 `*` 和 `.` 运算符时解引用应该触发的逻辑。

### 示例代码

```rust
use std::ops::Deref;
struct TattleTell<T> {
    value: T,
}
impl<T> Deref for TattleTell<T> {
    type Target = T;
    fn deref(&self) -> &T {
        println!("{} was used!", std::any::type_name::<T>());
        &self.value
    }
}
fn main() {
    let foo = TattleTell {
        value: "secret message",
    };
    // dereference occurs here immediately 
    // after foo is auto-referenced for the
    // function `len`
    println!("{}", foo.len());
}
```$rust95$,
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
  'b2a30096-0001-4001-8001-000000000096',
  'b2a30008-0001-4001-8001-000000000108',
  '96. 智能不安全代码',
  '智能指针倾向于经常使用*不安全*的代码。如前所述，它们是与 Rust 中最低级别的内存进行交互的常用工具。',
  $rust96$智能指针倾向于经常使用*不安全*的代码。如前所述，它们是与 Rust 中最低级别的内存进行交互的常用工具。

什么是不安全代码? 不安全代码的行为与普通 Rust 完全一样，除了一些 Rust 编译器无法保证的功能。

不安全代码的主要功能是*解引用指针*。 这意味着将*原始指针*指向内存中的某个位置并声明“此处存在数据结构！” 并将其转换为您可以使用的数据表示（例如将`*const u8` 转换为`u8`）。 Rust 无法跟踪写入内存的每个字节的含义。
 因为 Rust 不能保证在用作 *指针* 的任意数字上存在什么，所以它将解引用放在一个 `unsafe { ... }` 块中。

智能指针广泛地被用来*解引用指针*，它们的作用得到了很好的证明。

### 示例代码

```rust
fn main() {
    let a: [u8; 4] = [86, 14, 73, 64];
    // this is a raw pointer. Getting the memory address
    // of something as a number is totally safe
    let pointer_a = &a as *const u8 as usize;
    println!("Data memory location: {}", pointer_a);
    // Turning our number into a raw pointer to a f32 is
    // also safe to do.
    let pointer_b = pointer_a as *const f32;
    let b = unsafe {
        // This is unsafe because we are telling the compiler
        // to assume our pointer is a valid f32 and
        // dereference it's value into the variable b.
        // Rust has no way to verify this assumption is true.
        *pointer_b
    };
    println!("I swear this is a pie! {}", b);
}
```$rust96$,
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
  'b2a30097-0001-4001-8001-000000000097',
  'b2a30008-0001-4001-8001-000000000108',
  '97. 熟悉的朋友',
  '想一想一些我们已经见过的智能指针，例如 `Vec<T>` 和 `String`。',
  $rust97$想一想一些我们已经见过的智能指针，例如 `Vec<T>` 和 `String`。

`Vec<T>` 是一个智能指针，它只拥有一些字节的内存区域。  Rust 编译器不知道这些字节中存在着什么。 智能指针解释从它管理的内存区域获取数据意味着什么，跟踪这些字节中的数据结构开始和结束的位置，最后将指针解引用到数据结构中， 成为一个漂亮干净的可以阅读的接口供我们使用（例如`my_vec[3]`）。

类似地，`String` 跟踪字节的内存区域，并以编程方式将写入其中的内容限制为始终有效的 `utf-8`，并帮助将该内存区域解引用为类型 `&str`。

这两种数据结构都使用不安全的解引用指针来完成它们的工作。

内存细节：

- Rust 有一个相当于 C 的 `malloc`方法，
alloc 和 Layout 
来获取你自己管理的内存区域。

### 示例代码

```rust
use std::alloc::{alloc, Layout};
use std::ops::Deref;

struct Pie {
    secret_recipe: usize,
}

impl Pie {
    fn new() -> Self {
        // let's ask for 4 bytes
        let layout = Layout::from_size_align(4, 1).unwrap();

        unsafe {
            // allocate and save the memory location as a number
            let ptr = alloc(layout) as *mut u8;
            // use pointer math and write a few 
            // u8 values to memory
            ptr.write(86);
            ptr.add(1).write(14);
            ptr.add(2).write(73);
            ptr.add(3).write(64);

            Pie { secret_recipe: ptr as usize }
        }
    }
}
impl Deref for Pie {
    type Target = f32;
    fn deref(&self) -> &f32 {
        // interpret secret_recipe pointer as a f32 raw pointer
        let pointer = self.secret_recipe as *const f32;
        // dereference it into a return value &f32
        unsafe { &*pointer }
    }
}
fn main() {
    let p = Pie::new();
    // "make a pie" by dereferencing our 
    // Pie struct smart pointer
    println!("{:?}", *p);
}
```$rust97$,
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
  'b2a30098-0001-4001-8001-000000000098',
  'b2a30008-0001-4001-8001-000000000108',
  '98. 堆分配内存',
  '`Box` 是一个可以让我们将数据从堆栈移动到堆的智能指针。',
  $rust98$`Box` 是一个可以让我们将数据从堆栈移动到堆的智能指针。

解引用可以让我们以人类更容易理解的方式使用堆分配的数据，就好像它是原始类型一样。

### 示例代码

```rust
struct Pie;

impl Pie {
    fn eat(&self) {
        println!("tastes better on the heap!")
    }
}

fn main() {
    let heap_pie = Box::new(Pie);
    heap_pie.eat();
}
```$rust98$,
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

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  'b2a30099-0001-4001-8001-000000000099',
  'b2a30008-0001-4001-8001-000000000108',
  '99. 重温error的使用',
  'Rust可能有过多的错误表示方法，但标准库有一个通用特性 `std::error::Error` 来描述错误。',
  $rust99$Rust可能有过多的错误表示方法，但标准库有一个通用特性 `std::error::Error` 来描述错误。

使用智能指针“Box”，我们可以使用类型`Box<dyn std::error::Error>`作为常见的返回错误类型，因为它允许我们在堆上、高级别的传播错误，而不必知道特定的类型。

在 Rust 之旅的早期，我们了解到 `main` 可以返回一个错误。我们现在可以返回一个类型，该类型能够描述我们程序中可能发生的几乎任何类型的错误，只要错误的数据结构实现了 Rust 的通用`Error`特征。

```rust
fn main() -> Result>
```

### 示例代码

```rust
use core::fmt::Display;
use std::error::Error;

struct Pie;

#[derive(Debug)]
struct NotFreshError;

impl Display for NotFreshError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "This pie is not fresh!")
    }
}

impl Error for NotFreshError {}

impl Pie {
    fn eat(&self) -> Result<(), Box<dyn Error>> {
        Err(Box::new(NotFreshError))
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let heap_pie = Box::new(Pie);
    heap_pie.eat()?;
    Ok(())
}
```$rust99$,
  NULL, NULL, NULL, true, false,
  9
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
  'b2a30100-0001-4001-8001-000000000100',
  'b2a30008-0001-4001-8001-000000000108',
  '100. 引用计数',
  '`Rc` 是一个能将数据从栈移动到智能指针。       它允许我们克隆其他`Rc`智能指针，这些指针都具有不可改变地借用放在堆上的数据的能力。',
  $rust100$`Rc` 是一个能将数据从栈移动到智能指针。       它允许我们克隆其他`Rc`智能指针，这些指针都具有不可改变地借用放在堆上的数据的能力。

只有当最后一个智能指针被删除时，堆上的数据才会被释放。

### 示例代码

```rust
use std::rc::Rc;

struct Pie;

impl Pie {
    fn eat(&self) {
        println!("tastes better on the heap!")
    }
}

fn main() {
    let heap_pie = Rc::new(Pie);
    let heap_pie2 = heap_pie.clone();
    let heap_pie3 = heap_pie2.clone();

    heap_pie3.eat();
    heap_pie2.eat();
    heap_pie.eat();

    // all reference count smart pointers are dropped now
    // the heap data Pie finally deallocates
}
```$rust100$,
  NULL, NULL, NULL, true, false,
  10
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
  'b2a30101-0001-4001-8001-000000000101',
  'b2a30008-0001-4001-8001-000000000108',
  '101. 共享访问',
  '`RefCell` 是一个容器数据结构，通常由智能指针拥有，它接收数据并让我们借用可变或不可变引用来访问内部内容。 当您要求借用数据时，它通过在运行时强制执行 Rust 的内存安全规则来防止借用被滥用',
  $rust101$`RefCell` 是一个容器数据结构，通常由智能指针拥有，它接收数据并让我们借用可变或不可变引用来访问内部内容。 当您要求借用数据时，它通过在运行时强制执行 Rust 的内存安全规则来防止借用被滥用

**只有一个可变引用或多个不可变引用，但不能同时有！**

如果你违反了这些规则，`RefCell` 将会panic。

### 示例代码

```rust
use std::cell::RefCell;

struct Pie {
    slices: u8
}

impl Pie {
    fn eat(&mut self) {
        println!("tastes better on the heap!");
        self.slices -= 1;
    }
}

fn main() {
    // RefCell validates memory safety at runtime
    // notice: pie_cell is not mut!
    let pie_cell = RefCell::new(Pie{slices:8});
    
    {
        // but we can borrow mutable references!
        let mut mut_ref_pie = pie_cell.borrow_mut();
        mut_ref_pie.eat();
        mut_ref_pie.eat();
        
        // mut_ref_pie is dropped at end of scope
    }
    
    // now we can borrow immutably once our mutable reference drops
     let ref_pie = pie_cell.borrow();
     println!("{} slices left",ref_pie.slices);
}
```$rust101$,
  NULL, NULL, NULL, true, false,
  11
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
  'b2a30102-0001-4001-8001-000000000102',
  'b2a30008-0001-4001-8001-000000000108',
  '102. 线程间共享',
  '`Mutex` 是一种容器数据结构，通常由智能指针持有，它接收数据并让我们借用对其中数据的可变和不可变引用。  这可以防止借用被滥用，因为操作系统一次只限制一个 CPU 线程访问数据，阻塞其他线程，直到原线程完成其锁定的借用。',
  $rust102$`Mutex` 是一种容器数据结构，通常由智能指针持有，它接收数据并让我们借用对其中数据的可变和不可变引用。  这可以防止借用被滥用，因为操作系统一次只限制一个 CPU 线程访问数据，阻塞其他线程，直到原线程完成其锁定的借用。

多线程超出了 Rust 之旅的范围，但 `Mutex` 是协调多个 CPU 线程访问相同数据的基本部分。

有一个特殊的智能指针 `Arc`，它与 `Rc` 相同，除了使用线程安全的引用计数递增。 它通常用于对同一个 `Mutex` 进行多次引用。

### 示例代码

```rust
use std::sync::Mutex;

struct Pie;

impl Pie {
    fn eat(&self) {
        println!("only I eat the pie right now!");
    }
}

fn main() {
    let mutex_pie = Mutex::new(Pie);
    // let's borrow a locked immutable reference of pie
    // we have to unwrap the result of a lock
    // because it might fail
    let ref_pie = mutex_pie.lock().unwrap();
    ref_pie.eat();
    // locked reference drops here, and mutex protected value can be used by someone else
}
```$rust102$,
  NULL, NULL, NULL, true, false,
  12
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
  'b2a30103-0001-4001-8001-000000000103',
  'b2a30008-0001-4001-8001-000000000108',
  '103. 组合智能指针',
  '智能指针看起来可能会存在一些限制，但是我们可以做一些非常有用的结合。',
  $rust103$智能指针看起来可能会存在一些限制，但是我们可以做一些非常有用的结合。

`Rc<Vec<Foo>>` - 允许克隆多个可以借用堆上不可变数据结构的相同向量的智能指针。

`Rc<RefCell<Foo>>` - 允许多个智能指针可变/不可变地借用相同的结构`Foo`

`Arc<Mutex<Foo>>` - 允许多个智能指针以 CPU 线程独占方式锁定临时可变/不可变借用的能力。

内存细节：

- 您会注意到一个包含许多这些组合的主题。  使用不可变数据类型（可能由多个智能指针拥有）来修改内部数据。
这在 Rust 中被称为“内部可变性”模式。 这种模式让我们可以在运行时以与 Rust 的编译时检查相同的安全级别来改变内存使用规则。

### 示例代码

```rust
use std::cell::RefCell;
use std::rc::Rc;

struct Pie {
    slices: u8,
}

impl Pie {
    fn eat_slice(&mut self, name: &str) {
        println!("{} took a slice!", name);
        self.slices -= 1;
    }
}

struct SeaCreature {
    name: String,
    pie: Rc<RefCell<Pie>>,
}

impl SeaCreature {
    fn eat(&self) {
        // use smart pointer to pie for a mutable borrow
        let mut p = self.pie.borrow_mut();
        // take a bite!
        p.eat_slice(&self.name);
    }
}

fn main() {
    let pie = Rc::new(RefCell::new(Pie { slices: 8 }));
    // ferris and sarah are given clones of smart pointer to pie
    let ferris = SeaCreature {
        name: String::from("ferris"),
        pie: pie.clone(),
    };
    let sarah = SeaCreature {
        name: String::from("sarah"),
        pie: pie.clone(),
    };
    ferris.eat();
    sarah.eat();

    let p = pie.borrow();
    println!("{} slices left", p.slices);
}
```$rust103$,
  NULL, NULL, NULL, true, false,
  13
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
  'b2a30104-0001-4001-8001-000000000104',
  'b2a30008-0001-4001-8001-000000000108',
  '104. 第8章 - 总结',
  '智能指针是 Rust编程中经常使用的，它可以让我们不必重新创建非常常见的内存使用范式。 有了它，您可以准备好应对最艰难的挑战了！ 现在我们掌握了 Rust 的基础，让我们来谈谈如何编写更庞大的项目。 在下一章中，我们将摆脱一个文件包含所有代',
  $rust104$智能指针是 Rust编程中经常使用的，它可以让我们不必重新创建非常常见的内存使用范式。 有了它，您可以准备好应对最艰难的挑战了！ 现在我们掌握了 Rust 的基础，让我们来谈谈如何编写更庞大的项目。 在下一章中，我们将摆脱一个文件包含所有代码的束缚。$rust104$,
  NULL, NULL, NULL, true, false,
  14
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
  'b2a30106-0001-4001-8001-000000000106',
  'b2a30009-0001-4001-8001-000000000109',
  '106. 模块',
  '每个 Rust 程序或者库都叫 *crate*。',
  $rust106$每个 Rust 程序或者库都叫 *crate*。

每个 crate 都是由*模块*的层次结构组成。

每个 crate 都有一个根模块。

模块里面可以有全局变量、全局函数、全局结构体、全局 Trait 甚至是全局模块！

在 Rust 中，文件与模块树的层次结构并不是一对一的映射关系。我们必须在我们的代码中手动构建模块树。$rust106$,
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
  'b2a30107-0001-4001-8001-000000000107',
  'b2a30009-0001-4001-8001-000000000109',
  '107. 编写程序',
  '应用程序的根模块需要在一个叫 `main.rs` 的文件里面。',
  $rust107$应用程序的根模块需要在一个叫 `main.rs` 的文件里面。$rust107$,
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
  'b2a30108-0001-4001-8001-000000000108',
  'b2a30009-0001-4001-8001-000000000109',
  '108. 编写库',
  '库的根模块需要在一个叫 `lib.rs` 的文件里面。',
  $rust108$库的根模块需要在一个叫 `lib.rs` 的文件里面。$rust108$,
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
  'b2a30109-0001-4001-8001-000000000109',
  'b2a30009-0001-4001-8001-000000000109',
  '109. 引用其他模块和 crate',
  '你可以使用完整的模块路径路径引用模块中的项目： `std::f64::consts::PI`。',
  $rust109$你可以使用完整的模块路径路径引用模块中的项目： `std::f64::consts::PI`。

更简单的方法是使用**use**关键字。此关键字可以让我们在代码中使用模块中的项目而无需指定完整路径。例如 `use std::f64::consts::PI`
这样我在 main 函数中只需要写 `PI` 就可以了。

**std** 是 Rust 的**标准库**。这个库中包含了大量有用的数据结构和与操作系统交互的函数。

由社区创建的 crate 的搜索索引可以在这里找到： https://crates.io.

### 示例代码

```rust
use std::f64::consts::PI;

fn main() {
    println!("欢迎来到练习场！");
    println!("我想要一块 {}！", PI);
}
```$rust109$,
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
  'b2a30110-0001-4001-8001-000000000110',
  'b2a30009-0001-4001-8001-000000000109',
  '110. 引用多个项目',
  '在同一个模块路径中可以引用多个项目，比如：',
  $rust110$在同一个模块路径中可以引用多个项目，比如：

```rust
use std::f64::consts::{PI,TAU}
```

Ferris 不吃桃（TAU），它只吃派（PI）。$rust110$,
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
  'b2a30111-0001-4001-8001-000000000111',
  'b2a30009-0001-4001-8001-000000000109',
  '111. 创建模块',
  '当我们想到项目时，我们通常会想象一个以目录组织的文件层次结构。Rust 允许您创建与您的文件结构密切相关的模块。',
  $rust111$当我们想到项目时，我们通常会想象一个以目录组织的文件层次结构。Rust 允许您创建与您的文件结构密切相关的模块。

在 Rust 中，有两种方式来声明一个模块。例如，模块 `foo` 可以表示为：

- 一个名为 `foo.rs` 的文件。

- 在名为 `foo` 的目录，里面有一个叫 `mod.rs` 文件。$rust111$,
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
  'b2a30112-0001-4001-8001-000000000112',
  'b2a30009-0001-4001-8001-000000000109',
  '112. 模块层次结构',
  '模块可以互相依赖。要建立一个模块和其子模块之间的关系，你需要在父模块中这样写：',
  $rust112$模块可以互相依赖。要建立一个模块和其子模块之间的关系，你需要在父模块中这样写：

```rust
mod foo;
```

上面的声明将使编译器寻找一个名为 `foo.rs`或 `foo/mod.rs` 的文件，并将其内容插入这个作用域内名为 `foo` 的模块中。$rust112$,
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
  'b2a30113-0001-4001-8001-000000000113',
  'b2a30009-0001-4001-8001-000000000109',
  '113. 内联模块',
  '一个子模块可以直接内联在一个模块的代码中。',
  $rust113$一个子模块可以直接内联在一个模块的代码中。

内联模块最常见的用途是创建单元测试。 下面我们创建一个只有在使用 Rust 进行测试时才会存在的内联模块！

`// 当 Rust 不在测试模式时，这个宏会删除这个内联模块。
#[cfg(test)]
mod tests {
    // 请注意，我们并不能立即获得对父模块的访问。我们必须显式地导入它们。
    use super::*;

    ... 单元测试写在这里 ...
}
`$rust113$,
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
  'b2a30114-0001-4001-8001-000000000114',
  'b2a30009-0001-4001-8001-000000000109',
  '114. 模块内部引用',
  '你可以在你的 `use` 路径中使用如下 Rust 关键字来获得你想要的模块：',
  $rust114$你可以在你的 `use` 路径中使用如下 Rust 关键字来获得你想要的模块：

- `crate` - 你的 crate 的根模块

- `super` - 当前模块的父模块

- `self` - 当前模块$rust114$,
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

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES (
  'b2a30115-0001-4001-8001-000000000115',
  'b2a30009-0001-4001-8001-000000000109',
  '115. 导出',
  '默认情况下，*模块*的成员不能从模块外部访问（甚至它的子模块也不行！）。 我们可以使用 `pub` 关键字使一个模块的成员可以从外部访问。',
  $rust115$默认情况下，*模块*的成员不能从模块外部访问（甚至它的子模块也不行！）。 我们可以使用 `pub` 关键字使一个模块的成员可以从外部访问。

默认情况下，*crate* 中的成员无法从当前 crate 之外访问。我们可以通过在根模块中 (`lib.rs` 或 `main.rs`)， 将成员标记为 `pub` 使它们可以访问。$rust115$,
  NULL, NULL, NULL, true, false,
  9
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
  'b2a30116-0001-4001-8001-000000000116',
  'b2a30009-0001-4001-8001-000000000109',
  '116. 结构体可见性',
  '就像函数一样，结构体可以使用 `pub` 声明它们想要在模块外暴露的东西。',
  $rust116$就像函数一样，结构体可以使用 `pub` 声明它们想要在模块外暴露的东西。

### 示例代码

```rust
// SeaCreature 结构体在我们的模块外面也能使用了
pub struct SeaCreature {
    pub animal_type: String,
    pub name: String,
    pub arms: i32,
    pub legs: i32,
    // 我们把武器信息保密起来好了
    weapon: String,
}
```$rust116$,
  NULL, NULL, NULL, true, false,
  10
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
  'b2a30117-0001-4001-8001-000000000117',
  'b2a30009-0001-4001-8001-000000000109',
  '117. Prelude',
  '你可能很好奇，为什么我们在没用 `use` 导入 `Vec` 或 `Box` 的情况下却可以到处使用它们。',
  $rust117$你可能很好奇，为什么我们在没用 `use` 导入 `Vec` 或 `Box` 的情况下却可以到处使用它们。
这是因为标准库中有一个叫 `prelude` 的模块。

要知道，在 Rust 标准库中，以 `std::prelude::*` 导出的任何东西都会自动提供给 Rust 的各个部分。
`Vec` 和 `Box` 便是如此，并且其他东西（Option、Copy 等）也是如此。$rust117$,
  NULL, NULL, NULL, true, false,
  11
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
  'b2a30118-0001-4001-8001-000000000118',
  'b2a30009-0001-4001-8001-000000000109',
  '118. 你自己的 Prelude',
  '你看，既然标准库里面有 prelude，那么你自己的库里面最好也要有一个 prelude 模块。 这个模块可以作为其他使用你的库的用户的起点：他们可以借此导入你的库里面所有常用的数据结构 (例如 `use my_library::prelu',
  $rust118$你看，既然标准库里面有 prelude，那么你自己的库里面最好也要有一个 prelude 模块。 这个模块可以作为其他使用你的库的用户的起点：他们可以借此导入你的库里面所有常用的数据结构 (例如 `use my_library::prelude::*`)。
当然，这个模块就不会在用了你的库的程序或别的库里面自动启用了。不过使用这个惯例的话，大家会很轻松地知道从何开始的。

Ferris 说：“当个好 rustacean，帮助蟹友奏好序曲（prelude）！”$rust118$,
  NULL, NULL, NULL, true, false,
  12
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
  'b2a30119-0001-4001-8001-000000000119',
  'b2a30009-0001-4001-8001-000000000109',
  '119. 第九章 - 总结',
  '现在，你应该学会了如何创建并与世界分享你的 Rust 应用程序和库了。 不要担心现在记不住这些东西。等以后你的库发展了，用的人多了，你自己会清楚每个阶段应该做什么的。',
  $rust119$现在，你应该学会了如何创建并与世界分享你的 Rust 应用程序和库了。 不要担心现在记不住这些东西。等以后你的库发展了，用的人多了，你自己会清楚每个阶段应该做什么的。

其他资源（英文）：

- Guidelines For Writing Rust APIs$rust119$,
  NULL, NULL, NULL, true, false,
  13
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

-- courseId: b2a30001-0001-4001-8001-000000000001
-- 共 10 章、111 课
