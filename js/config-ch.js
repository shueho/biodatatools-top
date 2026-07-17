// ===================== 【功能配置区 - 仅在此增删分类/工具】 =====================
const toolConfig = [
    {
        categoryName: "核酸序列处理",
        categoryIcon: "🧬",
        tools: [
{
    toolName: "GenBank特征提取",
    toolDesc: "支持上传GenBank文件/粘贴GenBank文本，提取基因、CDS、mRNA、内含子等特征序列。",
    toolIcon: "images/001.png",
    link: "ch/001.Genbank_feat_extract.html"
},

{
    toolName: "核酸到氨基酸序列翻译",
    toolDesc: "将蛋白编码基因序列翻译为氨基酸序列（支持简并/混合碱基智能翻译）。",
    toolIcon: "images/005.png",
    link: "ch/005.CDS_translate.html"
},

{
    toolName: "DNA/RNA/氨基酸序列拼接",
    toolDesc: "核酸（DNA/RNA）和蛋白质序列清洗拼接。",
    toolIcon: "images/006.png",
    link: "ch/006.Seq_concat.html"
},

{
    toolName: "批量FASTA转AXT",
    toolDesc: "将比对好的 FASTA文件或文本转换为AXT成对比对格式。",
    toolIcon: "images/010.png",
    link: "ch/010.Fasta_to_AXT.html"
},

{
    toolName: "FASTA文件追加合并",
    toolDesc: "将多个FASTA文件合并为一个文件，并在序列ID前添加来源文件名前缀。",
    toolIcon: "images/013.png",
    link: "ch/013.Fasta_append_merge.html"
},

{
    toolName: "批量提取/修改FASTA序列ID",
    toolDesc: "批量提取或修改FASTA序列的ID。",
    toolIcon: "images/014.png",
    link: "ch/014.Fasta_id_modify.html"
},

{
    toolName: "FASTA序列清洗工具",
    toolDesc: "批量清洗DNA/RNA/蛋白质FASTA序列，可删除或替换非允许字符。",
    toolIcon: "images/015.png",
    link: "ch/015.Sequence_cleaner.html"
},

{
    toolName: "FASTA序列提取/重命名",
    toolDesc: "从FASTA文件中提取指定序列，可选择是否修改序列ID。",
    link: "ch/018.Fasta_extract_rename.html"
},

        ]
    },
    {
        categoryName: "统计分析",
        categoryIcon: "📐",
        tools: [
{
    toolName: "RSCU计算工具",
    toolDesc: "相对同义密码子使用度计算（RSCU）。",
    toolIcon: "images/002.png",
    link: "ch/002.RSCU.html"
},

{
    toolName: "Expasy Protparam参数批量计算（蛋白质理化性质）",
    toolDesc: "导入蛋白/氨基酸序列，在网页中批量计算Expasy Protparam可以得到的所有参数。",
    toolIcon: "images/007.png",
    link: "ch/007.Protparam.html"
},

{
    toolName: "碱基组成统计",
    toolDesc: "批量统计FASTA序列的碱基频数、GC/AT含量及Skew值。",
    toolIcon: "images/009.png",
    link: "ch/009.Base_composition.html"
},

{
    toolName: "密码子各位点碱基组成统计",
    toolDesc: "计算密码子三个位点A/T/G/C碱基的频数或频率，支持密码子过滤。",
    toolIcon: "images/011.png",
    link: "ch/011.Codon_position_base_stats.html"
},

{
    toolName: "CodonW指数在线计算",
    toolDesc: "参考CodonW源码在线计算T3s、C3s、A3s、G3s、Nc、GC3s与GC。",
    toolIcon: "images/012.png",
    link: "ch/012.CodonW_indices.html"
},

{
    toolName: "分组统计碱基/氨基酸使用情况",
    toolDesc: "导入FASTA序列并设置分组后按分组统计碱基或氨基酸的频数或频率。",
    link: "ch/016.Group_freq_stat.html"
},

        ]
    },
    {
        categoryName: "绘图与美化",
        categoryIcon: "📈",
        tools: [
{
    toolName: "RSCU柱形图绘制",
    toolDesc: "支持单序列/多基因/多物种RSCU柱形图绘制。",
    toolIcon: "images/003.png",
    link: "ch/003.RSCU_plot.html"
},

{
    toolName: "tRNA二级结构图美化组图工具",
    toolDesc: "对MITOS或ViennaRNA RNAplot输出的tRNA二级结构图进行美化。",
    toolIcon: "images/004.png",
    link: "ch/004.Trna_structure_beautifier.html"
},

{
    toolName: "基因排列可视化（基因重排图）",
    toolDesc: "用于展示基因排布及基因重排，支持区分正负链及非编码区的可视化。",
    toolIcon: "images/008.png",
    link: "ch/008.Visualize_gene_arrangement.html"
},


        ]
    },
    {
        categoryName: "小工具",
        categoryIcon: "🔧",
        tools: [
{
    toolName: "DnaSP序列分组生成器",
    toolDesc: "快速生成用于DnaSP序列分组的TaxSet语句，减少手动分组的工作量。",
    link: "ch/017.TaxSet_generator.html"
},

{
    toolName: "PopART导入文件生成器",
    toolDesc: "从Arlequin输出文件（XML或纯文本）中提取单倍型序列和群体单倍型频数矩阵，生成NEXUS格式文件用于PopART绘制单倍型网络图。",
    link: "ch/019.PopART_nexus_generator.html"
},

{
    toolName: "SAMOVA地图预览",
    toolDesc: "上传或粘贴SAMOVA生成的HTML文件或源码，即可预览采样点分组情况。",
    link: "ch/020.Samova_geo_map.html"
},

{
    toolName: "ARP与HAP文件合并工具",
    toolDesc: "将DnaSP生成的ARP文件和HAP文件合并为单个ARP文件，可以用于导入SAMOVA软件。",
    link: "ch/021.Arp_hap_merger.html"
},

{
    toolName: "宽表格与长表格数据互转工具",
    toolDesc: "在宽格式（多列变量）与长格式（变量-值对）之间灵活转换表格数据。",
    link: "ch/022.Wide_long_table_reshaping.html"
},

{
    toolName: "三角矩阵合并与拆分工具",
    toolDesc: "将完整方阵拆分为左下三角和右上三角矩阵，或将两个三角矩阵合并为完整方阵。",
    link: "ch/023.Triangular_matrix_tool.html"
},

{
    toolName: "三角矩阵重排工具",
    toolDesc: "导入左下三角矩阵，调整行/列顺序或选取子集，生成新的下三角矩阵及长格式数据。",
    link: "ch/024.Triangular_matrix_reorder.html"
},

{
    toolName: "经纬度格式互转工具",
    toolDesc: "经纬度格式转换工具，支持度分秒(DMS)与十进制之间的相互转换。",
    link: "ch/025.Geo_coordinate_converter.html"
},
        ]
    },

    {
        categoryName: "其他",
        categoryIcon: "📋",
        tools: [
{
    toolName: "脚本下载",
    toolDesc: "点击脚本名称或下载按钮即可获取脚本。",
    toolIcon: "images/999.png",
    link: "ch/999.Script_download.html"
},

{
    toolName: "常用链接",
    toolDesc: "收藏的生物信息学工具、数据库及资源。",
    toolIcon: "images/998.png",
    link: "ch/998.Links.html"
},

{
    toolName: "软件下载",
    toolDesc: "生物信息学常用软件下载或官方链接。",
    link: "ch/997.Software_download.html"
},
        ]
    }
];
// =============================================================================