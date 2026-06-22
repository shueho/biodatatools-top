// ========== 密码子表全局配置 & 工具函数 ==========
const TABLE_ID_NAME_MAP = {
    1:  "1 - Standard Code",
    2:  "2 - Vertebrate Mitochondrial Code",
    3:  "3 - Yeast Mitochondrial Code",
    4:  "4 - Mold/Protozoan/Coelenterate Mitochondrial Code ...", //& Mycoplasma/Spiroplasma Code
    5:  "5 - Invertebrate Mitochondrial Code",
    6:  "6 - Ciliate/Nuclear/Hexamita Nuclear Code",
    9:  "9 - Echinoderm/Flatworm Mitochondrial Code",
    10: "10 - Euplotid Nuclear Code",
    11: "11 - Bacterial/Archaeal/Plant Plastid Code",
    12: "12 - Alternative Yeast Nuclear Code",
    13: "13 - Ascidian Mitochondrial Code",
    14: "14 - Alternative Flatworm Mitochondrial Code",
    15: "15 - Blepharisma Nuclear Code",
    16: "16 - Chlorophycean Mitochondrial Code",
    21: "21 - Trematode Mitochondrial Code",
    22: "22 - Scenedesmus obliquus Mitochondrial Code",
    23: "23 - Thraustochytrium Mitochondrial Code"
};

const TABLE_ID_TYPE_MAP = {
    1: "standard",
    2: "transl_table=2",
    3: "transl_table=3",
    4: "transl_table=4",
    5: "transl_table=5",
    6: "transl_table=6",
    9: "transl_table=9",
    10: "transl_table=10",
    11: "transl_table=11",
    12: "transl_table=12",
    13: "transl_table=13",
    14: "transl_table=14",
    15: "transl_table=15",
    16: "transl_table=16",
    21: "transl_table=21",
    22: "transl_table=22",
    23: "transl_table=23"
};

const AA_ONE_TO_THREE = {
    "A":"Ala", "R":"Arg", "N":"Asn", "D":"Asp", "C":"Cys",
    "Q":"Gln", "E":"Glu", "G":"Gly", "H":"His", "I":"Ile",
    "L":"Leu", "K":"Lys", "M":"Met", "F":"Phe", "P":"Pro",
    "S":"Ser", "T":"Thr", "W":"Trp", "Y":"Tyr", "V":"Val",
    "TER":"TER"
};

function getTableName(tableId){
    return TABLE_ID_NAME_MAP[tableId] || "Unknown";
}

function getTableType(tableId){
    return TABLE_ID_TYPE_MAP[Number(tableId)] || "standard";
}

function getAll64Codons() {
    const bases = ["U","C","A","G"];
    const list = [];
    for(let b1 of bases)
        for(let b2 of bases)
            for(let b3 of bases)
                list.push(b1 + b2 + b3);
    return list;
}

function buildCodonMapFromRule(type) {
    const allCodons = getAll64Codons();
    const codonMap = {};

    if (typeof getGeneticCodeString !== "function") {
        allCodons.forEach(c => codonMap[c] = "UNK");
        return codonMap;
    }

    const ruleStr = getGeneticCodeString(type);
    if (!ruleStr || ruleStr === "true") {
        allCodons.forEach(c => codonMap[c] = "UNK");
        return codonMap;
    }

    const ruleList = ruleStr.replace(/\s+/g, "").split(",");
    allCodons.forEach(c => codonMap[c] = "UNK");

    for (const rule of ruleList) {
        if (!rule) continue;
        const eqIdx = rule.lastIndexOf("=");
        if (eqIdx <= 0) continue;

        const patternStr = rule.slice(0, eqIdx);
        let aaChar = rule.slice(eqIdx + 1);
        if (aaChar === "*") aaChar = "TER";

        if (patternStr.startsWith("/") && patternStr.endsWith("/")) {
            const regBody = patternStr.slice(1, -1);
            const reg = new RegExp(regBody, "i");

            for (const codon of allCodons) {
                const dnaLike = codon.replace(/U/g, "t");
                if (reg.test(dnaLike)) {
                    codonMap[codon] = aaChar;
                }
            }
        }
    }

    return codonMap;
}

function getCodonTable(tableId){
    const type = getTableType(tableId);
    return buildCodonMapFromRule(type);
}