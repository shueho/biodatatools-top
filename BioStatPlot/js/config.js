/**
 * BioPlot Tool Configuration - Three-level classification
 * Now with real chart links
 */
const toolCategories = [
    {
        name: "Basic Plots",
        icon: "📊",
        subcategories: [
            {
                name: "Pie Chart",
                icon: "🥧",
                tools: [
                    { name: "Pie / Donut Chart", icon: "1.svg", link: "plots/pie.html" }
                ]
            },
            {
                name: "Bar Chart",
                icon: "📊",
                tools: [
                    { name: "Grouped Bar Chart", icon: "📊", link: "plots/bar.html" },
                    { name: "Stacked Bar Chart", icon: "📊", link: "plots/bar.html" }
                ]
            },
            {
                name: "Box Plot",
                icon: "📦",
                tools: [
                    { name: "Box Plot", icon: "📦", link: "plots/box.html" }
                ]
            },
            {
                name: "Violin Plot",
                icon: "🎻",
                tools: [
                    { name: "Violin Plot", icon: "🎻", link: "plots/violin.html" }
                ]
            },
            {
                name: "Scatter Plot",
                icon: "🔵",
                tools: [
                    { name: "Scatter Plot", icon: "🔵", link: "plots/scatter.html" }
                ]
            },
            {
                name: "Line Chart",
                icon: "📈",
                tools: [
                    { name: "Line Chart", icon: "📈", link: "plots/line.html" }
                ]
            }
        ]
    },
    {
        name: "Transcriptome",
        icon: "🧬",
        subcategories: [
            {
                name: "Differential Expression",
                icon: "🌋",
                tools: [
                    { name: "Volcano Plot", icon: "🌋", link: "plots/volcano.html" }
                ]
            },
            {
                name: "Expression Matrix",
                icon: "🔥",
                tools: [
                    { name: "Heatmap", icon: "🔥", link: "plots/heatmap.html" }
                ]
            }
        ]
    },
    {
        name: "Set Operations",
        icon: "🔄",
        subcategories: [
            {
                name: "Venn Diagram",
                icon: "🔴",
                tools: [
                    { name: "Venn Diagram", icon: "🔴", link: "plots/venn.html" }
                ]
            }
        ]
    }
];
