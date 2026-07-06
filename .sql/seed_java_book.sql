-- 《Java 入门实战》文档课程
-- 课程内容：Java 基础语法、面向对象、集合、常用工具类、异常、文件、Maven/Spring Boot 入门
-- 执行：supabase db query --linked --file .sql/seed_java_book.sql

BEGIN;

INSERT INTO public.courses (
  id, title, description, is_free, status, price, sort_order
) VALUES (
  '4a7a0001-0001-4001-8001-000000000001',
  'Java 入门实战',
  '从第一个 main 方法开始，循序渐进掌握 Java 变量、控制流、集合、面向对象、StringBuilder、ArrayList、HashMap、日期时间、异常、文件操作、Maven 和 Spring Boot 入门。每节都包含可复制运行的 Java 示例。',
  true,
  'published',
  0,
  40
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status,
  price = EXCLUDED.price,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

DELETE FROM public.lessons WHERE chapter_id IN (
  '4a7a0001-0001-4001-8001-000000000101',
  '4a7a0001-0001-4001-8001-000000000102',
  '4a7a0001-0001-4001-8001-000000000103',
  '4a7a0001-0001-4001-8001-000000000104'
);

DELETE FROM public.chapters WHERE id IN (
  '4a7a0001-0001-4001-8001-000000000101',
  '4a7a0001-0001-4001-8001-000000000102',
  '4a7a0001-0001-4001-8001-000000000103',
  '4a7a0001-0001-4001-8001-000000000104'
);

INSERT INTO public.chapters (id, course_id, title, description, sort_order)
VALUES
  (
    '4a7a0001-0001-4001-8001-000000000101',
    '4a7a0001-0001-4001-8001-000000000001',
    '第一章：Java 基础语法',
    '从环境、main 方法、变量类型、控制流到方法拆分。',
    0
  ),
  (
    '4a7a0001-0001-4001-8001-000000000102',
    '4a7a0001-0001-4001-8001-000000000001',
    '第二章：面向对象与集合',
    '用业务对象、封装、继承、多态和集合组织真实数据。',
    1
  ),
  (
    '4a7a0001-0001-4001-8001-000000000104',
    '4a7a0001-0001-4001-8001-000000000001',
    '第三章：常用工具类',
    '重点掌握 StringBuilder、ArrayList、HashMap、Collections、日期时间和判空工具。',
    2
  ),
  (
    '4a7a0001-0001-4001-8001-000000000103',
    '4a7a0001-0001-4001-8001-000000000001',
    '第四章：工程化入门',
    '异常、文件、Maven、接口分层和 Spring Boot 入门。',
    3
  )
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.lessons (
  id, chapter_id, title, description, content_markdown,
  video_id, video_url, duration, is_free, is_locked, sort_order
) VALUES
(
  '4a7a0001-0001-4001-8001-000000000201',
  '4a7a0001-0001-4001-8001-000000000101',
  '01. 第一个 Java 程序',
  '理解 JDK、class、main 方法和从上到下执行。',
  $md01$
## Java 程序长什么样

Java 很适合用来学习“工程化编程”：代码组织清楚、类型明确、生态成熟。

最小可运行程序通常从 `main` 方法开始：

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
        System.out.println("Welcome to zood.work");
    }
}
```

### 这段代码做了什么

- `public class Main` 定义一个类，文件名通常叫 `Main.java`
- `main` 是程序入口
- `System.out.println` 把内容打印到控制台
- Java 语句通常以分号 `;` 结尾

### 生活类比

你可以把 `main` 想象成一家店开门后的第一张任务清单：先打招呼，再处理订单，再打印小票。

```java
public class Main {
    public static void main(String[] args) {
        String shop = "楼下咖啡店";
        String item = "拿铁";
        int price = 18;

        System.out.println("店铺：" + shop);
        System.out.println("商品：" + item);
        System.out.println("价格：" + price + " 元");
    }
}
```

### 小练习

把上面的 `shop`、`item`、`price` 换成你今天真实买过的一样东西。
$md01$,
  NULL, NULL, NULL, true, false, 0
),
(
  '4a7a0001-0001-4001-8001-000000000202',
  '4a7a0001-0001-4001-8001-000000000101',
  '02. 变量、类型与字符串',
  '用订单信息理解 int、double、boolean、String。',
  $md02$
## 变量：给数据贴标签

Java 是强类型语言：变量在声明时要说明里面放什么类型的数据。

```java
public class Main {
    public static void main(String[] args) {
        String userName = "小明";
        int age = 22;
        double balance = 128.50;
        boolean isVip = true;

        System.out.println(userName);
        System.out.println(age);
        System.out.println(balance);
        System.out.println(isVip);
    }
}
```

### 常见基础类型

| 类型 | 用途 | 示例 |
|------|------|------|
| `int` | 整数 | 库存、年龄、数量 |
| `double` | 小数 | 金额、体重、评分 |
| `boolean` | 是否 | 是否登录、是否付款 |
| `String` | 文本 | 姓名、手机号、地址 |

### 字符串拼接

```java
public class Main {
    public static void main(String[] args) {
        String product = "机械键盘";
        int count = 2;
        double price = 299.0;

        System.out.println("商品：" + product);
        System.out.println("数量：" + count);
        System.out.println("总价：" + count * price);
    }
}
```

### 命名建议

- 变量名用小驼峰：`userName`、`orderTotal`
- 名字表达业务含义，不要写成 `a`、`b`、`temp`
- 金额最好明确单位，例如 `priceYuan`
$md02$,
  NULL, NULL, NULL, true, false, 1
),
(
  '4a7a0001-0001-4001-8001-000000000203',
  '4a7a0001-0001-4001-8001-000000000101',
  '03. 条件判断与循环',
  '用优惠券、库存、订单列表理解 if、for、while。',
  $md03$
## if：根据条件做选择

```java
public class Main {
    public static void main(String[] args) {
        double amount = 128.0;
        boolean hasCoupon = true;

        if (amount >= 100 && hasCoupon) {
            System.out.println("可使用满减券");
        } else if (amount >= 100) {
            System.out.println("金额满足，但没有优惠券");
        } else {
            System.out.println("未达到优惠门槛");
        }
    }
}
```

## for：按次数或清单重复

```java
public class Main {
    public static void main(String[] args) {
        String[] packages = {"书", "耳机", "水杯"};

        for (int i = 0; i < packages.length; i++) {
            System.out.println("正在派送：" + packages[i]);
        }
    }
}
```

## while：直到条件不满足

```java
public class Main {
    public static void main(String[] args) {
        int battery = 20;

        while (battery < 100) {
            System.out.println("充电中：" + battery + "%");
            battery += 20;
        }

        System.out.println("充满了");
    }
}
```

### 什么时候用

- `if`：判断能不能下单、能不能打折
- `for`：处理固定数量的数据
- `while`：重复执行直到状态达成
$md03$,
  NULL, NULL, NULL, true, false, 2
),
(
  '4a7a0001-0001-4001-8001-000000000204',
  '4a7a0001-0001-4001-8001-000000000101',
  '04. 方法与参数',
  '把重复逻辑封装成可复用的方法。',
  $md04$
## 方法：把重复动作打包

方法适合把“计算配送费”“格式化价格”“校验手机号”这类重复逻辑封装起来。

```java
public class Main {
    public static void main(String[] args) {
        double fee = calcDeliveryFee(5);
        System.out.println("配送费：" + fee);
    }

    static double calcDeliveryFee(int distanceKm) {
        if (distanceKm <= 3) {
            return 0;
        }
        return (distanceKm - 3) * 2.0;
    }
}
```

### 多个参数

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(formatOrder("咖啡", 18, 2));
    }

    static String formatOrder(String item, double price, int count) {
        double total = price * count;
        return item + " x " + count + "，总价：" + total + " 元";
    }
}
```

### 方法设计建议

- 一个方法只做一件明确的事
- 方法名用动词开头：`calc`、`format`、`check`
- 参数不要太多，超过 3 到 4 个就考虑封装对象
$md04$,
  NULL, NULL, NULL, true, false, 3
),
(
  '4a7a0001-0001-4001-8001-000000000205',
  '4a7a0001-0001-4001-8001-000000000102',
  '05. 类与对象',
  '用 User、Order 建模，理解字段、构造方法和实例方法。',
  $md05$
## 类是模板，对象是实例

现实业务里经常会有“用户”“订单”“课程”这样的概念。Java 用类来描述它们。

```java
class Order {
    String shop;
    double total;
    boolean paid;

    Order(String shop, double total) {
        this.shop = shop;
        this.total = total;
        this.paid = false;
    }

    void pay() {
        this.paid = true;
        System.out.println(shop + " 订单已支付：" + total + " 元");
    }
}

public class Main {
    public static void main(String[] args) {
        Order order = new Order("兰州拉面", 23);
        order.pay();
        System.out.println("支付状态：" + order.paid);
    }
}
```

### 关键点

- 字段保存对象状态：`shop`、`total`、`paid`
- 构造方法负责初始化对象
- 实例方法描述对象能做什么
- `this` 表示“当前这个对象”

### 小练习

定义一个 `User` 类，包含 `name`、`age` 字段和 `introduce()` 方法。
$md05$,
  NULL, NULL, NULL, true, false, 0
),
(
  '4a7a0001-0001-4001-8001-000000000206',
  '4a7a0001-0001-4001-8001-000000000102',
  '06. 封装、继承与多态',
  '理解 private、getter/setter、extends 和接口式思维。',
  $md06$
## 封装：把内部细节保护起来

```java
class BankAccount {
    private String owner;
    private double balance;

    BankAccount(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    public double getBalance() {
        return balance;
    }
}

public class Main {
    public static void main(String[] args) {
        BankAccount account = new BankAccount("小周", 100);
        account.deposit(50);
        System.out.println(account.getBalance());
    }
}
```

## 继承：复用共同能力

```java
class Animal {
    void speak() {
        System.out.println("发出声音");
    }
}

class Cat extends Animal {
    @Override
    void speak() {
        System.out.println("喵");
    }
}

public class Main {
    public static void main(String[] args) {
        Animal animal = new Cat();
        animal.speak();
    }
}
```

### 多态是什么

变量类型是父类 `Animal`，实际对象是子类 `Cat`，运行时会调用子类自己的实现。这就是多态。
$md06$,
  NULL, NULL, NULL, true, false, 1
),
(
  '4a7a0001-0001-4001-8001-000000000207',
  '4a7a0001-0001-4001-8001-000000000102',
  '07. 数组、List 与 Map',
  '用购物车和通讯录理解 Java 常用集合。',
  $md07$
## 数组：固定长度清单

```java
public class Main {
    public static void main(String[] args) {
        String[] items = {"牛奶", "面包", "咖啡"};

        for (String item : items) {
            System.out.println(item);
        }
    }
}
```

## List：可变长度列表

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> cart = new ArrayList<>();
        cart.add("键盘");
        cart.add("鼠标");
        cart.add("显示器");

        System.out.println("购物车数量：" + cart.size());
        System.out.println(cart);
    }
}
```

## Map：键值对

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, String> contacts = new HashMap<>();
        contacts.put("妈妈", "13800001111");
        contacts.put("快递站", "13900002222");

        System.out.println(contacts.get("妈妈"));
    }
}
```

### 选择建议

- 数量固定：数组
- 经常增删：`List`
- 需要按 key 查找：`Map`
$md07$,
  NULL, NULL, NULL, true, false, 2
),
(
  '4a7a0001-0001-4001-8001-000000000210',
  '4a7a0001-0001-4001-8001-000000000104',
  '08. StringBuilder 与字符串处理',
  '理解 String 不可变，以及如何高效拼接和处理文本。',
  $md10$
## 为什么需要 StringBuilder

`String` 在 Java 中是不可变对象。少量拼接用 `+` 没问题，但循环里大量拼接时，更推荐 `StringBuilder`。

```java
public class Main {
    public static void main(String[] args) {
        StringBuilder receipt = new StringBuilder();

        receipt.append("订单小票\n");
        receipt.append("商品：咖啡\n");
        receipt.append("数量：").append(2).append("\n");
        receipt.append("总价：").append(36).append(" 元");

        System.out.println(receipt.toString());
    }
}
```

### 常用方法

| 方法 | 用途 |
|------|------|
| `append` | 追加内容 |
| `insert` | 在指定位置插入 |
| `delete` | 删除一段内容 |
| `replace` | 替换一段内容 |
| `reverse` | 反转字符串 |
| `toString` | 转回 String |

### 例子：把清单拼成一行

```java
public class Main {
    public static void main(String[] args) {
        String[] items = {"牛奶", "面包", "咖啡"};
        StringBuilder builder = new StringBuilder();

        for (int i = 0; i < items.length; i++) {
            if (i > 0) {
                builder.append("、");
            }
            builder.append(items[i]);
        }

        System.out.println("购物清单：" + builder);
    }
}
```

### 记忆口诀

- 少量字符串拼接：`+`
- 循环或复杂拼接：`StringBuilder`
- 多线程共享拼接：了解 `StringBuffer`，但日常更常用 `StringBuilder`
$md10$,
  NULL, NULL, NULL, true, false, 0
),
(
  '4a7a0001-0001-4001-8001-000000000211',
  '4a7a0001-0001-4001-8001-000000000104',
  '09. ArrayList 常用操作',
  '掌握 add、get、set、remove、contains 和遍历。',
  $md11$
## ArrayList 是最常用的 List 实现

`ArrayList` 适合保存一组有顺序、数量会变化的数据，比如购物车、课程列表、消息列表。

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> cart = new ArrayList<>();

        cart.add("键盘");
        cart.add("鼠标");
        cart.add("显示器");

        System.out.println(cart.get(0));
        System.out.println("数量：" + cart.size());
        System.out.println("是否有鼠标：" + cart.contains("鼠标"));
    }
}
```

### 修改和删除

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> tasks = new ArrayList<>();
        tasks.add("写代码");
        tasks.add("跑测试");
        tasks.add("提交代码");

        tasks.set(1, "修复测试");
        tasks.remove("提交代码");

        for (String task : tasks) {
            System.out.println(task);
        }
    }
}
```

### 常见坑

- 下标从 `0` 开始
- `get(index)` 超出范围会抛 `IndexOutOfBoundsException`
- 遍历时直接删除元素容易出问题，建议用 `removeIf`

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> scores = new ArrayList<>();
        scores.add(59);
        scores.add(88);
        scores.add(42);
        scores.add(96);

        scores.removeIf(score -> score < 60);
        System.out.println(scores);
    }
}
```
$md11$,
  NULL, NULL, NULL, true, false, 1
),
(
  '4a7a0001-0001-4001-8001-000000000212',
  '4a7a0001-0001-4001-8001-000000000104',
  '10. HashMap 常用操作',
  '用 key-value 保存配置、计数和快速查找。',
  $md12$
## HashMap：按 key 快速查值

`HashMap` 很像通讯录：名字是 key，手机号是 value。

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, String> contacts = new HashMap<>();

        contacts.put("妈妈", "13800001111");
        contacts.put("快递站", "13900002222");

        System.out.println(contacts.get("妈妈"));
        System.out.println(contacts.getOrDefault("公司", "未保存"));
    }
}
```

### 遍历 Map

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> cart = new HashMap<>();
        cart.put("咖啡", 2);
        cart.put("面包", 3);

        for (Map.Entry<String, Integer> entry : cart.entrySet()) {
            System.out.println(entry.getKey() + " x " + entry.getValue());
        }
    }
}
```

### 例子：统计单词次数

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        String[] words = {"java", "spring", "java", "map"};
        Map<String, Integer> counter = new HashMap<>();

        for (String word : words) {
            counter.put(word, counter.getOrDefault(word, 0) + 1);
        }

        System.out.println(counter);
    }
}
```

### 记住这几个方法

- `put(key, value)`：写入或覆盖
- `get(key)`：读取，可能返回 `null`
- `getOrDefault(key, defaultValue)`：读取不到时给默认值
- `containsKey(key)`：判断 key 是否存在
- `remove(key)`：删除
$md12$,
  NULL, NULL, NULL, true, false, 2
),
(
  '4a7a0001-0001-4001-8001-000000000213',
  '4a7a0001-0001-4001-8001-000000000104',
  '11. Collections、Arrays 与排序',
  '掌握排序、反转、查找和数组/列表互转。',
  $md13$
## Collections：操作集合的工具类

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> scores = new ArrayList<>();
        scores.add(88);
        scores.add(59);
        scores.add(96);

        Collections.sort(scores);
        System.out.println("升序：" + scores);

        Collections.reverse(scores);
        System.out.println("反转：" + scores);
    }
}
```

## Arrays：操作数组的工具类

```java
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] numbers = {3, 1, 2};

        Arrays.sort(numbers);
        System.out.println(Arrays.toString(numbers));
    }
}
```

### 数组转 List

```java
import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        String[] items = {"咖啡", "面包", "牛奶"};
        List<String> list = Arrays.asList(items);

        System.out.println(list);
    }
}
```

### 对对象排序

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

class Product {
    String name;
    int price;

    Product(String name, int price) {
        this.name = name;
        this.price = price;
    }
}

public class Main {
    public static void main(String[] args) {
        List<Product> products = new ArrayList<>();
        products.add(new Product("咖啡", 18));
        products.add(new Product("面包", 8));

        products.sort(Comparator.comparingInt(product -> product.price));

        for (Product product : products) {
            System.out.println(product.name + ": " + product.price);
        }
    }
}
```
$md13$,
  NULL, NULL, NULL, true, false, 3
),
(
  '4a7a0001-0001-4001-8001-000000000214',
  '4a7a0001-0001-4001-8001-000000000104',
  '12. 日期时间、Objects 与 Optional',
  '掌握 LocalDateTime、Objects.equals 和 Optional 的基础用法。',
  $md14$
## 日期时间：java.time

现代 Java 推荐使用 `java.time` 包，例如 `LocalDate`、`LocalTime`、`LocalDateTime`。

```java
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Main {
    public static void main(String[] args) {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        System.out.println(now.format(formatter));
        System.out.println(now.plusDays(7).format(formatter));
    }
}
```

## Objects：安全比较和判空

```java
import java.util.Objects;

public class Main {
    public static void main(String[] args) {
        String a = null;
        String b = "java";

        System.out.println(Objects.equals(a, b));
        System.out.println(Objects.isNull(a));
        System.out.println(Objects.nonNull(b));
    }
}
```

## Optional：表达“可能没有值”

`Optional` 不是为了替代所有 `null`，而是让返回值“可能为空”这件事更明确。

```java
import java.util.Optional;

public class Main {
    public static void main(String[] args) {
        Optional<String> nickname = Optional.ofNullable(null);

        String displayName = nickname.orElse("匿名用户");
        System.out.println(displayName);
    }
}
```

### 实战建议

- 时间处理优先用 `java.time`
- 字符串或对象比较优先用 `Objects.equals(a, b)`，避免空指针
- 方法返回值可能为空时，可以考虑 `Optional<T>`
- 类字段不要滥用 `Optional`，它更适合作为方法返回值
$md14$,
  NULL, NULL, NULL, true, false, 4
),
(
  '4a7a0001-0001-4001-8001-000000000208',
  '4a7a0001-0001-4001-8001-000000000103',
  '13. 异常与文件读写',
  '理解 try/catch、finally 和读取本地文件。',
  $md08$
## 异常：程序运行中的意外情况

```java
public class Main {
    public static void main(String[] args) {
        try {
            int result = 10 / 0;
            System.out.println(result);
        } catch (ArithmeticException e) {
            System.out.println("计算失败：" + e.getMessage());
        } finally {
            System.out.println("无论成功失败都会执行");
        }
    }
}
```

## 读取文件

```java
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("notes.txt");
        Files.writeString(path, "今天学习 Java 文件操作");

        String content = Files.readString(path);
        System.out.println(content);
    }
}
```

### 工程建议

- 能预判的错误用条件判断提前处理
- 外部资源错误用异常处理，例如文件、网络、数据库
- 不要把异常吞掉，至少记录错误信息
$md08$,
  NULL, NULL, NULL, true, false, 0
),
(
  '4a7a0001-0001-4001-8001-000000000209',
  '4a7a0001-0001-4001-8001-000000000103',
  '14. Maven 与 Spring Boot 入门',
  '理解 Java 项目结构、依赖管理和一个最小 Web 接口。',
  $md09$
## Maven 解决什么问题

当项目变大后，你会需要：

- 管理第三方依赖
- 统一编译和打包
- 约定项目目录结构

典型 Maven 项目结构：

```text
my-app
├── pom.xml
└── src
    └── main
        └── java
            └── com/example/demo
                └── Main.java
```

## Spring Boot 最小接口

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello, Java Web!";
    }
}
```

### 从脚本到工程

前面的课程让你能写单个 Java 文件；Maven 和 Spring Boot 让你开始做真实后端服务。

下一步可以继续学习：

- HTTP 与 REST API
- 数据库 JDBC / JPA
- 登录鉴权
- 单元测试
- Docker 部署
$md09$,
  NULL, NULL, NULL, true, false, 1
)
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_markdown = EXCLUDED.content_markdown,
  video_id = NULL,
  video_url = NULL,
  duration = NULL,
  is_free = EXCLUDED.is_free,
  is_locked = EXCLUDED.is_locked,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

COMMIT;
