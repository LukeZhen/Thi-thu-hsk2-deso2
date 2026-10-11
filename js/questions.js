/*
 * DỮ LIỆU ĐỀ THI — HSK（二级）H20902
 * Nhập nguyên văn từ file "Đề HSK 2 số 2.pdf" (chữ giản thể, giữ pinyin như đề gốc).
 * File này KHÔNG chứa đáp án. Đáp án nằm trong js/key.js (được mã hoá, tạo từ admin/answer-key.json).
 *
 * Cú pháp văn bản: các token cách nhau bởi dấu cách.
 *   汉字{pinyin}  -> hiển thị chữ Hán có pinyin phía trên
 *   __            -> ô trống (phần đọc 41–45), hiển thị đáp án thí sinh đã chọn
 *   token khác    -> hiển thị nguyên văn (dấu câu, chữ số…)
 * Mỗi phần tử của mảng "lines" là một dòng.
 */
window.HSK_EXAM = {
  code: 'H20902',
  title: 'HSK（二级）模拟考试',
  level: 2,
  audio: {
    src: 'assets/audio/hsk2_h20902_listening.mp3',
    durationSec: 1557, // 25:57 — đo từ file gốc
    note: 'Một file audio duy nhất cho toàn bộ 35 câu nghe; mỗi câu đã được đọc 2 lần trong file gốc.'
  },
  sections: [
    {
      id: 'listening', zh: '一、听力', vi: 'Nghe hiểu', range: [1, 35],
      groups: [
        {
          id: 'L1', title: '第一部分', range: [1, 10], type: 'tf',
          vi: 'Nghe câu nói, xem hình và chọn √ (đúng) hoặc × (sai).',
          example: { kind: 'tfimg', items: [{ img: 'l1_ex_t', mark: '√' }, { img: 'l1_ex_f', mark: '×' }] },
          questions: [
            { n: 1, img: 'l01' }, { n: 2, img: 'l02' }, { n: 3, img: 'l03' }, { n: 4, img: 'l04' }, { n: 5, img: 'l05' },
            { n: 6, img: 'l06' }, { n: 7, img: 'l07' }, { n: 8, img: 'l08' }, { n: 9, img: 'l09' }, { n: 10, img: 'l10' }
          ]
        },
        {
          id: 'L2a', title: '第二部分', range: [11, 15], type: 'bank-img',
          vi: 'Nghe hội thoại, chọn hình phù hợp (A–F).',
          bank: [['A', 'p2a_A'], ['B', 'p2a_B'], ['C', 'p2a_C'], ['D', 'p2a_D'], ['E', 'p2a_E'], ['F', 'p2a_F']],
          example: {
            kind: 'text', answer: 'D', lines: [
              '男： 你{Nǐ} 喜欢{xǐhuan} 什么{shénme} 运动{yùndòng} ？',
              '女： 我{Wǒ} 最{zuì} 喜欢{xǐhuan} 踢{tī} 足球{zúqiú} 。'
            ]
          },
          questions: [{ n: 11 }, { n: 12 }, { n: 13 }, { n: 14 }, { n: 15 }]
        },
        {
          id: 'L2b', title: '第二部分', range: [16, 20], type: 'bank-img',
          vi: 'Nghe hội thoại, chọn hình phù hợp (A–E).',
          bank: [['A', 'p2b_A'], ['B', 'p2b_B'], ['C', 'p2b_C'], ['D', 'p2b_D'], ['E', 'p2b_E']],
          questions: [{ n: 16 }, { n: 17 }, { n: 18 }, { n: 19 }, { n: 20 }]
        },
        {
          id: 'L3', title: '第三部分', range: [21, 30], type: 'mc',
          vi: 'Nghe hội thoại và câu hỏi, chọn đáp án đúng (A/B/C).',
          example: {
            kind: 'mc', answer: 'A', lines: [
              '男： 小{Xiǎo} 王{Wáng} ， 这里{zhèlǐ} 有{yǒu} 几{jǐ} 个{ge} 杯子{bēizi} ， 哪个{nǎge} 是{shì} 你{nǐ} 的{de} ？',
              '女： 左边{Zuǒbian} 那个{nàge} 红色{hóngsè} 的{de} 是{shì} 我{wǒ} 的{de} 。',
              '问： 小{Xiǎo} 王{Wáng} 的{de} 杯子{bēizi} 是{shì} 什么{shénme} 颜色{yánsè} 的{de} ？'
            ],
            options: ['红色{hóngsè}', '黑色{hēisè}', '白色{báisè}']
          },
          questions: [
            { n: 21, options: ['工作{gōngzuò}', '打{dǎ} 篮球{lánqiú}', '看{kàn} 电视{diànshì}'] },
            { n: 22, options: ['饭店{fàndiàn}', '商店{shāngdiàn}', '教室{jiàoshì}'] },
            { n: 23, options: ['200 多{duō}', '2000 多{duō}', '3000 多{duō}'] },
            { n: 24, options: ['2007 年{nián}', '2008 年{nián}', '2009 年{nián}'] },
            { n: 25, options: ['太{tài} 累{lèi} 了{le}', '看过{kànguo} 了{le}', '有{yǒu} 别{bié} 的{de} 事{shì}'] },
            { n: 26, options: ['鱼{yú}', '西瓜{xīguā}', '鸡蛋{jīdàn}'] },
            { n: 27, options: ['机场{jīchǎng}', '医院{yīyuàn}', '火车站{huǒchēzhàn}'] },
            { n: 28, options: ['很{hěn} 便宜{piányi}', '颜色{yánsè} 好{hǎo}', '有点儿{yǒudiǎnr} 高{gāo}'] },
            { n: 29, options: ['7 月{yuè} 8 号{hào}', '8 月{yuè} 7 号{hào}', '8 月{yuè} 17 号{hào}'] },
            { n: 30, options: ['爸爸{bàba}', '妈妈{māma}', '送{sòng} 牛奶{niúnǎi} 的{de}'] }
          ]
        },
        {
          id: 'L4', title: '第四部分', range: [31, 35], type: 'mc',
          vi: 'Nghe đoạn hội thoại dài hơn và câu hỏi, chọn đáp án đúng (A/B/C).',
          example: {
            kind: 'mc', answer: 'A', lines: [
              '女： 请{Qǐng} 在{zài} 这儿{zhèr} 写{xiě} 您{nín} 的{de} 名字{míngzi} 。',
              '男： 是{Shì} 这儿{zhèr} 吗{ma} ？',
              '女： 不{Bú} 是{shì} ， 是{shì} 这儿{zhèr} 。',
              '男： 好{Hǎo} ， 谢谢{xièxie} 。',
              '问： 男{Nán} 的{de} 要{yào} 写{xiě} 什么{shénme} ？'
            ],
            options: ['名字{míngzi}', '时间{shíjiān}', '房间{fángjiān} 号{hào}']
          },
          questions: [
            { n: 31, options: ['吃{chī} 饭{fàn}', '买{mǎi} 菜{cài}', '喝{hē} 茶{chá}'] },
            { n: 32, options: ['很{hěn} 远{yuǎn}', '很{hěn} 近{jìn}', '不{bú} 太{tài} 远{yuǎn}'] },
            { n: 33, options: ['妻子{qīzi}', '妹妹{mèimei}', "女儿{nǚ'ér}"] },
            { n: 34, options: ['天{tiān} 晴{qíng} 了{le}', '下{xià} 雨{yǔ} 了{le}', '下{xià} 雪{xuě} 了{le}'] },
            { n: 35, options: ['朋友{péngyou} 要{yào} 来{lái}', '要{yào} 去{qù} 坐{zuò} 船{chuán}', '要{yào} 去{qù} 上课{shàngkè}'] }
          ]
        }
      ]
    },
    {
      id: 'reading', zh: '二、阅读', vi: 'Đọc hiểu', range: [36, 60],
      groups: [
        {
          id: 'R1', title: '第一部分', range: [36, 40], type: 'bank-img',
          vi: 'Đọc câu, chọn hình phù hợp (A–F).',
          bank: [['A', 'r1_A'], ['B', 'r1_B'], ['C', 'r1_C'], ['D', 'r1_D'], ['E', 'r1_E'], ['F', 'r1_F']],
          example: { kind: 'text', answer: 'D', lines: ['每{Měi} 个{ge} 星期六{xīngqīliù} ， 我{wǒ} 都{dōu} 去{qù} 打{dǎ} 篮球{lánqiú} 。'] },
          questions: [
            { n: 36, lines: ['同学们{Tóngxuémen} ， 你们{nǐmen} 听{tīng} 懂{dǒng} 了{le} 吗{ma} ？'] },
            { n: 37, lines: ['里面{Lǐmiàn} 有{yǒu} 你{nǐ} 最{zuì} 爱{ài} 吃{chī} 的{de} 水果{shuǐguǒ} 。'] },
            { n: 38, lines: ['喂{Wéi} ， 儿子{érzi} 生病{shēngbìng} 了{le} ， 你{nǐ} 什么{shénme} 时候{shíhou} 能{néng} 回来{huílai} ？'] },
            { n: 39, lines: ['我{Wǒ} 来{lái} 介绍{jièshào} 一下{yíxià} ， 这{zhè} 是{shì} 我{wǒ} 丈夫{zhàngfu} 。'] },
            { n: 40, lines: ['现在{Xiànzài} 快{kuài} 6 点{diǎn} 了{le} ， 我{wǒ} 20 分钟{fēnzhōng} 后{hòu} 去{qù} 公司{gōngsī} 找{zhǎo} 你{nǐ} 。'] }
          ]
        },
        {
          id: 'R2', title: '第二部分', range: [41, 45], type: 'bank-word',
          vi: 'Chọn từ thích hợp (A–F) điền vào chỗ trống.',
          bank: [['A', '房间{fángjiān}'], ['B', '旁边{pángbiān}'], ['C', '认识{rènshi}'], ['D', '完{wán}'], ['E', '贵{guì}'], ['F', '等{děng}']],
          example: { kind: 'text', answer: 'E', blankShows: 'E', lines: ['这儿{Zhèr} 的{de} 羊肉{yángròu} 很{hěn} 好吃{hǎochī} ， 但是{dànshì} 也{yě} 很{hěn} __ 。'] },
          questions: [
            { n: 41, lines: ['这些{Zhèxiē} 题{tí} 你{nǐ} 什么{shénme} 时候{shíhou} 能{néng} 做{zuò} __ ？'] },
            { n: 42, lines: ['快{Kuài} 点儿{diǎnr} ， 大家{dàjiā} 都{dōu} 在{zài} __ 你{nǐ} 吃{chī} 饭{fàn} 呢{ne} 。'] },
            { n: 43, lines: ['别{Bié} 找{zhǎo} 了{le} ， 手机{shǒujī} 在{zài} 桌子{zhuōzi} 上{shang} 呢{ne} ， 电脑{diànnǎo} __ 。'] },
            { n: 44, lines: ['我{Wǒ} 来{lái} 北京{Běijīng} 的{de} 第一{dì-yī} 天{tiān} 就{jiù} __ 他{tā} 了{le} 。'] },
            { n: 45, lines: ['男： __ 里{li} 有{yǒu} 人{rén} 吗{ma} ？', '女： 请{Qǐng} 进{jìn} ， 先生{xiānsheng} ， 您{nín} 找{zhǎo} 谁{shéi} ？'] }
          ]
        },
        {
          id: 'R3', title: '第三部分', range: [46, 50], type: 'tf',
          vi: 'Đọc đoạn văn, phán đoán câu có dấu ★ đúng (√) hay sai (×).',
          example: {
            kind: 'tftext', items: [
              { lines: ['现在{Xiànzài} 是{shì} 11 点{diǎn} 30 分{fēn} ， 他们{tāmen} 已经{yǐjīng} 游了{yóule} 20 分钟{fēnzhōng} 了{le} 。'], star: '★ 他们{Tāmen} 11 点{diǎn} 10 分{fēn} 开始{kāishǐ} 游泳{yóuyǒng} 。', mark: '√' },
              { lines: ['我{Wǒ} 会{huì} 跳舞{tiàowǔ} ， 但{dàn} 跳{tiào} 得{de} 不{bù} 怎么样{zěnmeyàng} 。'], star: '★ 我{Wǒ} 跳{tiào} 得{de} 非常{fēicháng} 好{hǎo} 。', mark: '×' }
            ]
          },
          questions: [
            { n: 46, lines: ['我{Wǒ} 知道{zhīdào} 她{tā} 的{de} 名字{míngzi} ， 她{tā} 姓{xìng} 杨{Yáng} ， 叫{jiào} 杨{Yáng} 笑笑{Xiàoxiao} ， 她{tā} 姐姐{jiějie} 是{shì} 我{wǒ} 同学{tóngxué} 。'],
              star: '★ 我{Wǒ} 认识{rènshi} 杨{Yáng} 笑笑{Xiàoxiao} 的{de} 姐姐{jiějie} 。' },
            { n: 47, lines: ['我{Wǒ} 的{de} 一{yí} 个{ge} 朋友{péngyou} 正在{zhèngzài} 找{zhǎo} 房子{fángzi} ， 希望{xīwàng} 住{zhù} 得{de} 离{lí} 公司{gōngsī} 近{jìn} 一些{yìxiē} ， 这样{zhèyàng} 他{tā} 每{měi} 天{tiān} 早上{zǎoshang} 就{jiù} 可以{kěyǐ} 7 点{diǎn} 起床{qǐchuáng} ， 比{bǐ} 现在{xiànzài} 多{duō} 睡{shuì} 一{yí} 个{ge} 小时{xiǎoshí} 。'],
              star: '★ 朋友{Péngyou} 现在{xiànzài} 每{měi} 天{tiān} 7 点{diǎn} 起床{qǐchuáng} 。' },
            { n: 48, lines: ['我{Wǒ} 喜欢{xǐhuan} 猫{māo} ， 但是{dànshì} 丈夫{zhàngfu} 不{bù} 喜欢{xǐhuan} ， 所以{suǒyǐ} 到{dào} 现在{xiànzài} 家{jiā} 里{li} 也{yě} 没有{méiyǒu} 猫{māo} 。 我{Wǒ} 希望{xīwàng} 有{yǒu} 一{yì} 天{tiān} 能{néng} 有{yǒu} 一{yí} 个{ge} 小猫{xiǎomāo} 。'],
              star: '★ 我{Wǒ} 丈夫{zhàngfu} 想{xiǎng} 要{yào} 一{yí} 个{ge} 小猫{xiǎomāo} 。' },
            { n: 49, lines: ['从{Cóng} 我{wǒ} 家{jiā} 到{dào} 北京{Běijīng} ， 坐{zuò} 火车{huǒchē} 就{jiù} 5 个{ge} 小时{xiǎoshí} ， 比{bǐ} 坐{zuò} 飞机{fēijī} 便宜{piányi} 很{hěn} 多{duō} 。 所以{Suǒyǐ} ， 明天{míngtiān} 我{wǒ} 准备{zhǔnbèi} 坐{zuò} 火车{huǒchē} 去{qù} 。'],
              star: '★ 我{Wǒ} 明天{míngtiān} 去{qù} 北京{Běijīng} 。' },
            { n: 50, lines: ['李哥{Lǐgē} ， 赵{Zhào} 老师{lǎoshī} 让{ràng} 我{wǒ} 告诉{gàosu} 你{nǐ} ， 你{nǐ} 的{de} 电影票{diànyǐngpiào} 买到{mǎidào} 了{le} 。'],
              star: '★ 李哥{Lǐgē} 正在{zhèngzài} 看{kàn} 电影{diànyǐng} 。' }
          ]
        },
        {
          id: 'R4a', title: '第四部分', range: [51, 55], type: 'bank-sent',
          vi: 'Chọn câu (A–F) có liên quan / đáp lại phù hợp với mỗi câu.',
          bank: [
            ['A', '别{Bié} 笑{xiào} 了{le} ， 我{wǒ} 说{shuō} 的{de} 是{shì} 真{zhēn} 的{de} 。'],
            ['B', '还{Hái} 可以{kěyǐ} ， 不{bú} 到{dào} 300 元{yuán} 。'],
            ['C', '这儿{Zhèr} 有{yǒu} 商店{shāngdiàn} 吗{ma} ？ 我{Wǒ} 想{xiǎng} 去{qù} 买{mǎi} 点儿{diǎnr} 东西{dōngxi} 。'],
            ['D', '是{Shì} 吗{ma} ？ 我{Wǒ} 的{de} 手表{shǒubiǎo} 慢{màn} 了{le} ？'],
            ['E', '他{Tā} 在{zài} 哪儿{nǎr} 呢{ne} ？ 你{Nǐ} 看见{kànjiàn} 他{tā} 了{le} 吗{ma} ？'],
            ['F', '那{Nà} 我{wǒ} 和{hé} 你{nǐ} 一起{yìqǐ} 去{qù} 。']
          ],
          example: { kind: 'text', answer: 'E', lines: ['他{Tā} 还{hái} 在{zài} 教室{jiàoshì} 里{li} 学习{xuéxí} 。'] },
          questions: [
            { n: 51, lines: ['9 点{diǎn} ？ 现在{Xiànzài} 已经{yǐjīng} 9 点{diǎn} 25 了{le} 。'] },
            { n: 52, lines: ['我{Wǒ} 家{jiā} 的{de} 狗{gǒu} 喜欢{xǐhuan} 吃{chī} 苹果{píngguǒ} 。'] },
            { n: 53, lines: ['你{Nǐ} 的{de} 自行车{zìxíngchē} 是{shì} 白色{báisè} 的{de} ？ 真{Zhēn} 漂亮{piàoliang} ， 贵{guì} 吗{ma} ？'] },
            { n: 54, lines: ['鸡蛋{Jīdàn} 吃{chī} 完{wán} 了{le} ， 下午{xiàwǔ} 我{wǒ} 再{zài} 买{mǎi} 一些{yìxiē} 。'] },
            { n: 55, lines: ['向{Xiàng} 前{qián} 走{zǒu} ， 就{jiù} 在{zài} 那儿{nàr} 。'] }
          ]
        },
        {
          id: 'R4b', title: '第四部分', range: [56, 60], type: 'bank-sent',
          vi: 'Chọn câu (A–E) có liên quan / đáp lại phù hợp với mỗi câu.',
          bank: [
            ['A', '我{Wǒ} 从{cóng} 您{nín} 这儿{zhèr} 学了{xuéle} 很{hěn} 多{duō} 。'],
            ['B', '新年{Xīnnián} 快乐{kuàilè} ！'],
            ['C', '我{Wǒ} 弟弟{dìdi} 在{zài} 北京{Běijīng} 大学{Dàxué} 读{dú} 书{shū} ， 今年{jīnnián} 是{shì} 第三{dì-sān} 年{nián} 了{le} 。'],
            ['D', '听说{Tīngshuō} 他{tā} 病{bìng} 了{le} ， 我们{wǒmen} 找{zhǎo} 时间{shíjiān} 去{qù} 看看{kànkan} 他{tā} 吧{ba} 。'],
            ['E', '这个{Zhège} 是{shì} 下午{xiàwǔ} 送{sòng} ？ 送{Sòng} 到{dào} 哪儿{nǎr} ？']
          ],
          questions: [
            { n: 56, lines: ['今天{Jīntiān} 是{shì} 1 月{yuè} 1 日{rì} 。'] },
            { n: 57, lines: ['等{Děng} 一下{yíxià} ， 我{wǒ} 打{dǎ} 电话{diànhuà} 问{wèn} 一下{yíxià} 。'] },
            { n: 58, lines: ['他{Tā} 会{huì} 说{shuō} 汉语{Hànyǔ} ？'] },
            { n: 59, lines: ['星期六{Xīngqīliù} 怎么样{zěnmeyàng} ？'] },
            { n: 60, lines: ['希望{Xīwàng} 我{wǒ} 的{de} 回答{huídá} 能{néng} 对{duì} 你{nǐ} 有{yǒu} 帮助{bāngzhù} 。'] }
          ]
        }
      ]
    }
  ]
};
