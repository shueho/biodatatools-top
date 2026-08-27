// ===================== 【功能配置区 - 仅在此增删分类/工具】 =====================
const toolConfig = [
    {
        categoryName: "Nucleic Acid Sequence Processing",
        categoryIcon: "🧬",
        tools: [
{
    toolName: "GenBank Feature Extractor",
    toolDesc: "Upload a GenBank file or paste GenBank text to extract sequences of genes, CDS, mRNA, introns, etc.",
    link: "en/001.Genbank_feat_extract.html"
},

{
    toolName: "Nucleotide to Amino Acid Translation",
    toolDesc: "Translate protein-coding gene sequences into amino acid sequences (supports degenerate/mixed codon translation).",
    toolIcon: "images/005.png",
    link: "en/005.CDS_translate.html"
},

{
    toolName: "DNA/RNA/Amino Acid Sequence Concatenation",
    toolDesc: "Clean and concatenate nucleic acid (DNA/RNA) and protein sequences.",
    toolIcon: "images/006.png",
    link: "en/006.Seq_concat.html"
},

{
    toolName: "Batch FASTA to AXT Conversion",
    toolDesc: "Convert aligned FASTA files or text into AXT pairwise alignment format.",
    toolIcon: "images/010.png",
    link: "en/010.Fasta_to_AXT.html"
},

{
    toolName: "FASTA File Append & Merge",
    toolDesc: "Merge multiple FASTA files into one, adding source filename prefix to each sequence ID.",
    toolIcon: "images/013.png",
    link: "en/013.Fasta_append_merge.html"
},

{
    toolName: "Batch Extract/Modify FASTA Sequence IDs",
    toolDesc: "Batch extract or modify FASTA sequence IDs.",
    toolIcon: "images/014.png",
    link: "en/014.Fasta_id_modify.html"
},

{
    toolName: "FASTA Sequence Cleaner",
    toolDesc: "Batch clean DNA/RNA/protein FASTA sequences, remove or replace non‑allowed characters.",
    toolIcon: "images/015.png",
    link: "en/015.Sequence_cleaner.html"
},

{
    toolName: "FASTA Sequence Extractor & Renamer",
    toolDesc: "Extract specified sequences from a FASTA file, with optional sequence ID renaming.",
    link: "en/018.Fasta_extract_rename.html"
},

{
    toolName: "FASTA Sequence Group Extraction",
    toolDesc: "Split a FASTA file into multiple smaller files based on a grouping table.",
    link: "en/027.Fasta_group_extract.html"
},

        ]
    },
    {
        categoryName: "Statistical Analysis",
        categoryIcon: "📐",
        tools: [
{
    toolName: "RSCU Calculator (Relative Synonymous Codon Usage)",
    toolDesc: "Relative Synonymous Codon Usage (RSCU) calculation.",
    link: "en/002.RSCU.html"
},

{
    toolName: "Expasy Protparam Batch Calculator (Protein Physicochemical Properties)",
    toolDesc: "Import protein/amino acid sequences and batch-calculate all parameters available from Expasy Protparam.",
    toolIcon: "images/007.png",
    link: "en/007.Protparam.html"
},

{
    toolName: "Base Composition Statistics",
    toolDesc: "Batch calculate base frequencies, GC/AT content and skew values for FASTA sequences.",
    toolIcon: "images/009.png",
    link: "en/009.Base_composition.html"
},

{
    toolName: "Codon Position Base Composition Statistics",
    toolDesc: "Calculate A/T/G/C base frequencies or counts at each of the three codon positions, with codon filtering support.",
    toolIcon: "images/011.png",
    link: "en/011.Codon_position_base_stats.html"
},

{
    toolName: "CodonW Indices Online Calculator",
    toolDesc: "Calculate T3s, C3s, A3s, G3s, Nc, GC3s and GC based on CodonW source code.",
    toolIcon: "images/012.png",
    link: "en/012.CodonW_indices.html"
},

{
    toolName: "Group Statistics for Base/Amino Acid Usage",
    toolDesc: "Import FASTA sequences, set groups, then calculate the frequency or count of bases or amino acids by group.",
    link: "en/016.Group_freq_stat.html"
},

{
    toolName: "Matrix Standardization Tool",
    toolDesc: "Import a matrix, perform row/column standardization, and calculate relative values.",
    link: "en/032.Matrix_standardization.html"
},

        ]
    },
    {
        categoryName: "Plotting & Visualization",
        categoryIcon: "📈",
        tools: [
{
    toolName: "RSCU Bar Plot Generator",
    toolDesc: "Generate RSCU bar plots for single sequence, multiple genes, or multiple species.",
    link: "en/003.RSCU_plot.html"
},

{
    toolName: "tRNA Secondary Structure Beautifier",
    toolDesc: "Enhance tRNA secondary structure diagrams exported from MITOS or ViennaRNA RNAplot.",
    toolIcon: "images/004.png",
    link: "en/004.Trna_structure_beautifier.html"
},

{
    toolName: "Gene Arrangement Visualization (Gene Rearrangement Map)",
    toolDesc: "Visualize gene order and rearrangements with support for distinguishing positive/negative strands and non-coding regions.",
    toolIcon: "images/008.png",
    link: "en/008.Visualize_gene_arrangement.html"
},


        ]
    },
    {
        categoryName: "Gadget",
        categoryIcon: "🔧",
        tools: [
{
    toolName: "DnaSP Sequence Group Generator",
    toolDesc: "Quickly generate TaxSet statements for sequence grouping in DnaSP, reducing the manual effort of grouping.",
    link: "en/017.TaxSet_generator.html"
},

{
    toolName: "PopART Import File Generator",
    toolDesc: "Extract haplotype sequences and population haplotype frequency matrices from Arlequin output files (XML or plain text) and generate NEXUS format files for constructing haplotype networks in PopART.",
    link: "en/019.PopART_nexus_generator.html"
},

{
    toolName: "SAMOVA Map Preview",
    toolDesc: "Upload or paste the SAMOVA-generated HTML file or source code to preview sampling site grouping.",
    link: "en/020.Samova_geo_map.html"
},

{
    toolName: "ARP & HAP Merger Tool",
    toolDesc: "Merge DnaSP-generated ARP and HAP files into a single ARP file for import into SAMOVA.",
    link: "en/021.Arp_hap_merger.html"
},

{
    toolName: "Wide/Long Table Reshaper",
    toolDesc: "Flexibly convert table data between wide format (multiple columns) and long format (variable-value pairs).",
    link: "en/022.Wide_long_table_reshaping.html"
},

{
    toolName: "Triangular Matrix Merge & Split Tool",
    toolDesc: "Split a full square matrix into lower‑left and upper‑right triangular matrices, or merge two triangular matrices into a full square matrix.",
    link: "en/023.Triangular_matrix_tool.html"
},

{
    toolName: "Triangular Matrix Reordering Tool",
    toolDesc: "Import a lower triangular matrix, reorder rows/columns or subset, generate new lower triangular matrix and long-format data.",
    link: "en/024.Triangular_matrix_reorder.html"
},

{
    toolName: "Coordinate Format Converter",
    toolDesc: "Convert between Decimal Degrees and Degrees/Minutes/Seconds (DMS) formats for geographic coordinates.",
    link: "en/025.Geo_coordinate_converter.html"
},

{
    toolName: "Long List to Lower Triangular Matrix",
    toolDesc: "Convert three-column data (Item1-Item2-Value) into a lower triangular matrix with order adjustment and subset selection.",
    link: "en/026.Long_to_triangular.html"
},

{
    toolName: "Haversine Distance Matrix Generator",
    toolDesc: "Calculate great-circle distances (km) between geographic coordinates.",
    link: "en/028.Haversine_distance_matrix.html"
},

{
    toolName: "ARWEN tRNA Secondary Structure Extraction",
    toolDesc: "Extract tRNA secondary structures from ARWEN output to facilitate downstream plotting.",
    link: "en/029.ARWEN_trna_extract.html"
},

{
    toolName: "Table Merge Tool",
    toolDesc: "Supports left merge, right merge, inner merge, outer merge, and horizontal stack.",
    link: "en/030.Table_merge_tool.html"
},

{
    toolName: "Table Column Explode",
    toolDesc: "Split separated values in a column into multiple rows, keeping other columns. Supports any separator (semicolon, comma, space, slash, etc.).",
    link: "en/031.Table_column_explode.html"
},
        ]
    },
    {
        categoryName: "Others",
        categoryIcon: "📋",
        tools: [
{
    toolName: "Script Download",
    toolDesc: "Click the script name or download button to get the script.",
    toolIcon: "images/999.png",
    link: "en/999.Script_download.html"
},

{
    toolName: "Useful Links",
    toolDesc: "Curated collection of bioinformatics tools, databases and resources.",
    toolIcon: "images/998.png",
    link: "en/998.Links.html"
},

{
    toolName: "Software Download",
    toolDesc: "Downloads and official links for commonly used bioinformatics software.",
    link: "en/997.Software_download.html"
},
        ]
    }
];
// =============================================================================