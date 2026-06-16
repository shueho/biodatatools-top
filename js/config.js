// ===================== 【功能配置区 - 仅在此增删分类/工具】 =====================
const toolConfig = [
    {
        categoryName: "核酸序列处理",
        categoryIcon: "🧬",
        tools: [
{
    toolName: "GenBank特征提取",
    toolDesc: "支持上传GB文件/粘贴GB文本，提取基因、CDS、mRNA、内含子等特征序列",
    toolIcon: "images/001.png",
    link: "function/001.genbank_feat_extract.html"
},

{
    toolName: "核酸到氨基酸序列翻译",
    toolDesc: "将蛋白编码基因序列翻译为氨基酸序列（支持简并/混合碱基智能翻译）",
    toolIcon: "images/005.png",
    link: "function/005.CDS_translate.html"
},

{
    toolName: "DNA/RNA/氨基酸序列拼接",
    toolDesc: "核酸（DNA/RNA）和蛋白质序列清洗拼接",
    toolIcon: "images/006.png",
    link: "function/006.Seq_concat.html"
},

{
    toolName: "批量FASTA转AXT",
    toolDesc: "将比对好的 FASTA 文件或文本转换为 AXT 成对比对格式",
    toolIcon: "images/010.png",
    link: "function/010.Fasta_to_AXT.html"
}

        ]
    },
    {
        categoryName: "统计分析",
        categoryIcon: "📐",
        tools: [
{
    toolName: "RSCU计算工具",
    toolDesc: "相对同义密码子使用度计算（RSCU）",
    toolIcon: "images/002.png",
    link: "function/002.RSCU.html"
},

{
    toolName: "Expasy Protparam 参数批量计算（蛋白质理化性质）",
    toolDesc: "导入蛋白/氨基酸序列，在网页中批量计算Expasy Protparam可以得到的所有参数",
    toolIcon: "images/007.png",
    link: "function/007.Protparam.html"
},

{
    toolName: "碱基组成统计",
    toolDesc: "批量统计 FASTA 序列的碱基频数、GC/AT 含量及 skew 值",
    toolIcon: "images/009.png",
    link: "function/009.Base_composition.html"
},


        ]
    },
    {
        categoryName: "绘图与美化",
        categoryIcon: "📈",
        tools: [
{
    toolName: "RSCU柱形图绘制",
    toolDesc: "支持单序列/多基因/多物种RSCU柱形图绘制",
    toolIcon: "images/003.png",
    link: "function/003.RSCU_plot.html"
},

{
    toolName: "tRNA二级结构图美化组图工具",
    toolDesc: "对MITOS或ViennaRNA RNAplot输出的tRNA二级结构图进行美化",
    toolIcon: "images/004.png",
    link: "function/004.Trna_structure_beautifier.html"
},

{
    toolName: "基因排列可视化（基因重排图）",
    toolDesc: "用于展示基因排布及基因重排，支持区分正负链及非编码区的可视化",
    toolIcon: "images/008.png",
    link: "function/008.Visualize_gene_arrangement.html"
},


        ]
    },
    {
        categoryName: "其他",
        categoryIcon: "📋",
        tools: [
            { toolName: "线粒体基因组分析流程", toolDesc: "预留空位", toolIcon: "⚙️", link: "module2_01.html" },

        ]
    }
];
// =============================================================================