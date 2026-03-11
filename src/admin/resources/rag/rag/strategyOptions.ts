export type RagStrategyOption = {
  value: string;
  label: string;
  rating?: number;
  details: string[];
};

export const strategyOptions: RagStrategyOption[] = [
  {
    value: "-1",
    label: "先不切块",
    details: ["上传后暂不进行切片，稍后可在“切片策略”页面发布任务。"],
  },
  {
    value: "0",
    label: "基础中文切割",
    rating: 6.5,
    details: [
      "JSON观察：total_chunks=4；长度[min=116, max=496, avg=399]；meta(max_size=500, overlap=50)",
      "优点：实现简单、成本低；中文标点与简单Markdown边界可用；长度控制合理",
      "局限：结构保持弱；句法与主题边界可能出现“句中断裂”",
      "适用：快速原型、轻量FAQ/公告类文本",
    ],
  },
  {
    value: "1",
    label: "递归字符切割（结构感知）",
    rating: 7.5,
    details: [
      "JSON观察：total_chunks=4；长度[min=156, max=495, avg=374]；meta(chunk_size=500, chunk_overlap=50)",
      "优点：保持段落与标题分隔，结构保真优于朴素切分",
      "局限：对表格/代码围栏的完整保持取决于分隔符配置",
      "适用：Markdown 文档的通用向量化",
    ],
  },
  {
    value: "2",
    label: "固定长度 + 边界感知",
    rating: 8.2,
    details: [
      "JSON观察：total_chunks=3；长度[min=339, max=597, avg=467]；meta(target_length=600, overlap=80)",
      "优点：优先句边界/换行/标题切分，减少句中断裂；稳定高效",
      "局限：结构保持有限；主题跨段需配合重排器",
      "适用：通用文档，默认策略",
    ],
  },
  {
    value: "3",
    label: "语义相似度驱动切分",
    rating: 8.8,
    details: [
      "JSON观察：total_chunks=4；长度[min=190, max=790, avg=408]；meta(max_size=800, min_size=200, overlap=100, threshold=0.35)",
      "优点：相邻句嵌入相似度驱动边界，主题连续性好",
      "局限：成本较高；阈值与超参需调优",
      "适用：高精度检索问答、论述/白皮书/手册",
    ],
  },
  {
    value: "4",
    label: "LLM 语义分段",
    rating: 7.2,
    details: [
      "JSON观察：total_chunks=5；长度[min=128, max=696, avg=289]；meta(chunk_size=800)",
      "优点：目标形态为“主题/任务/意图”分段；复杂布局优势",
      "局限：稳定性依赖模型与提示",
      "适用：规章制度、技术方案、规范条款（接入更强模型后评分可达9+）",
    ],
  },
  {
    value: "5",
    label: "层次切片（章节/段落/句子）",
    rating: 8.0,
    details: [
      "JSON观察：total_chunks=13；长度[min=8, max=320, avg=108]；meta(target_length=600, overlap=80)",
      "优点：多粒度组织；利于粗召回、细重排与答案拼接",
      "局限：索引规模与维护复杂；小块偏多依赖重排质量",
      "适用：书籍、手册、长报告、法律文本",
    ],
  },
  {
    value: "6",
    label: "滑动窗口",
    rating: 7.6,
    details: [
      "JSON观察：total_chunks=4；长度[min=316, max=600, avg=525]；meta(window_size=600, overlap=220)",
      "优点：高重叠保证跨块信息连续；实现简单",
      "局限：冗余与索引膨胀显著；成本上升",
      "适用：代码、公式、规范条款、术语密集文本",
    ],
  },
  {
    value: "7",
    label: "结构感知（代码块/列表/表格）",
    rating: 8.6,
    details: [
      "JSON观察：total_chunks=5；长度[min=29, max=781, avg=280]；meta(max_size=800)",
      "优点：保持结构整体，混排Markdown更友好",
      "局限：当语义跨度大时需配合语义切片或重排器",
      "适用：技术文档、设计文档（含代码/表格）",
    ],
  },
  {
    value: "8",
    label: "动态自适应（密度驱动）",
    rating: 8.1,
    details: [
      "JSON观察：total_chunks=7；长度[min=76, max=511, avg=203]；meta(base_chunk_size=700, overlap=80)",
      "优点：根据密度自适应长度，提升信息均衡性",
      "局限：启发式对语料特性敏感；需评估调优",
      "适用：主题密度波动较大的综合文档",
    ],
  },
  {
    value: "9",
    label: "关系联结",
    rating: 7.4,
    details: [
      "JSON观察：total_chunks=12；长度[min=25, max=673, avg=149]；meta(max_size=700)",
      "优点：跨块引用/链接联结，利于多段证据召回",
      "局限：就近合并可能引入噪声与跨主题混拼",
      "适用：知识性文档、跨段引用丰富的规范/说明",
    ],
  },
];

export function getStrategyOption(strategyId: string | number) {
  const key = String(strategyId);
  return strategyOptions.find((s) => s.value === key);
}
