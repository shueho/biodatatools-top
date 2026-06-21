// ===================== 【功能配置区 - 仅在此增删分类/工具】 =====================
const toolConfig = [
    {
        categoryName: "Nucleic Acid Sequence Processing",
        categoryIcon: "🧬",
        tools: [
{
    toolName: "GenBank Feature Extraction",
    toolDesc: "Upload GB file or paste GB text to extract gene, CDS, mRNA, intron and other feature sequences",
    toolIcon: "images/001.png",
    link: "function/001.Genbank_feat_extract.html"
},

{
    toolName: "Nucleotide to Amino Acid Translation",
    toolDesc: "Translate protein-coding gene sequences into amino acid sequences (supports degenerate/mixed codon translation)",
    toolIcon: "images/005.png",
    link: "function/005.CDS_translate.html"
},

{
    toolName: "DNA/RNA/Amino Acid Sequence Concatenation",
    toolDesc: "Clean and concatenate nucleic acid (DNA/RNA) and protein sequences",
    toolIcon: "images/006.png",
    link: "function/006.Seq_concat.html"
},

{
    toolName: "Batch FASTA to AXT Conversion",
    toolDesc: "Convert aligned FASTA files or text into AXT pairwise alignment format",
    toolIcon: "images/010.png",
    link: "function/010.Fasta_to_AXT.html"
},

{
    toolName: "FASTA File Append & Merge",
    toolDesc: "Merge multiple FASTA files into one, adding source filename prefix to each sequence ID",
    toolIcon: "images/013.png",
    link: "function/013.Fasta_append_merge.html"
},

        ]
    },
    {
        categoryName: "Statistical Analysis",
        categoryIcon: "📐",
        tools: [
{
    toolName: "RSCU Calculation Tool",
    toolDesc: "Calculate Relative Synonymous Codon Usage (RSCU)",
    toolIcon: "images/002.png",
    link: "function/002.RSCU.html"
},

{
    toolName: "Expasy Protparam Batch Calculator (Protein Physicochemical Properties)",
    toolDesc: "Import protein/amino acid sequences and batch-calculate all parameters available from Expasy Protparam",
    toolIcon: "images/007.png",
    link: "function/007.Protparam.html"
},

{
    toolName: "Base Composition Statistics",
    toolDesc: "Batch calculate base frequencies, GC/AT content and skew values for FASTA sequences",
    toolIcon: "images/009.png",
    link: "function/009.Base_composition.html"
},

{
    toolName: "Codon Position Base Composition Statistics",
    toolDesc: "Calculate A/T/G/C base frequencies or counts at each of the three codon positions, with codon filtering support",
    toolIcon: "images/011.png",
    link: "function/011.Codon_position_base_stats.html"
},

{
    toolName: "CodonW Indices Online Calculator",
    toolDesc: "Calculate T3s, C3s, A3s, G3s, Nc, GC3s and GC based on CodonW source code",
    toolIcon: "images/012.png",
    link: "function/012.CodonW_indices.html"
},

        ]
    },
    {
        categoryName: "Plotting & Visualization",
        categoryIcon: "📈",
        tools: [
{
    toolName: "RSCU Bar Plot Generator",
    toolDesc: "Generate RSCU bar plots for single sequence, multiple genes, or multiple species",
    toolIcon: "images/003.png",
    link: "function/003.RSCU_plot.html"
},

{
    toolName: "tRNA Secondary Structure Beautifier",
    toolDesc: "Enhance tRNA secondary structure diagrams exported from MITOS or ViennaRNA RNAplot",
    toolIcon: "images/004.png",
    link: "function/004.Trna_structure_beautifier.html"
},

{
    toolName: "Gene Arrangement Visualization (Gene Rearrangement Map)",
    toolDesc: "Visualize gene order and rearrangements with support for distinguishing positive/negative strands and non-coding regions",
    toolIcon: "images/008.png",
    link: "function/008.Visualize_gene_arrangement.html"
},


        ]
    },
    {
        categoryName: "Others",
        categoryIcon: "📋",
        tools: [
{
    toolName: "Script Download",
    toolDesc: "Click the script name or download button to get the script",
    toolIcon: "images/999.png",
    link: "function/999.Script_download.html"
},

{
    toolName: "Useful Links",
    toolDesc: "Curated collection of bioinformatics tools, databases and resources",
    toolIcon: "images/998.png",
    link: "function/998.Links.html"
},
        ]
    }
];
// =============================================================================