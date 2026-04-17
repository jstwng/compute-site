// Per-company descriptions (3-4 sentences) keyed by slug. Each description
// is synthesized from a specific Tavily web snippet retrieved in April 2026;
// the `source` URL is the page that the snippet came from and is surfaced
// in the profile panel and in sources.js.
//
// The "multiple" entry is a synthetic bucket used in the dataset to stand
// in for consortia of multiple investors listed in a single transaction;
// it has no external source.
export const DESCRIPTIONS = {
  // Chip designers
  'nvidia': {
    description: 'Designs graphics processing units (GPUs) — the category of chip NVIDIA introduced in 1999. Discrete GPUs were initially used for gaming but over time became essential for emerging workloads like VR and especially AI. NVIDIA is now one of only two companies still selling discrete GPUs for the broader class of AI training and inference workloads, alongside AMD.',
    source: 'https://www.nanalyze.com/2017/05/investing-gpus-ai-amd-vs-nvidia',
  },
  'amd': {
    description: 'Advanced Micro Devices, Inc. is an American multinational semiconductor company based in Santa Clara, California. AMD develops computer processors and related technologies for business and consumer markets, including CPUs, GPUs, and AI accelerators. While it initially manufactured its own processors, the company later outsourced manufacturing and is now fabless.',
    source: 'https://www.insidertrades.info/company/AMD-Advanced_Micro_Devices',
  },
  'broadcom': {
    description: 'Global technology leader that designs, develops, and supplies semiconductor and infrastructure software solutions. Broadcom\'s semiconductor portfolio includes custom XPUs (ASICs) and merchant networking solutions enabling hyperscaler AI infrastructure, alongside wireless connectivity, enterprise storage controllers, and optical components. The company has grown through acquisitions of VMware, Symantec, Brocade, and CA Technologies to span AI networking, cloud, and enterprise software.',
    source: 'https://firmsworld.com/broadcom-inc',
  },
  'marvell': {
    description: 'Global fabless semiconductor company that designs and develops solutions powering the world\'s data infrastructure. Marvell\'s technology spans data centers, 5G networks, automotive platforms, and enterprise infrastructure. The company has deep co-development relationships with hyperscale cloud customers and secures long-term contracts around custom AI ASIC programs.',
    source: 'https://compworth.com/company/marvell-semiconductor',
  },
  'intel': {
    description: 'Founded in 1968, Intel invented the x86 architecture of microprocessors that power most of the world\'s personal computers. Intel designs and manufactures CPUs, motherboard chipsets, network interface controllers, flash memory, graphics chips, and embedded processors. The company remains one of the top semiconductor chip makers by revenue and is building out a foundry business (Intel Foundry Services) alongside its Gaudi AI accelerator line.',
    source: 'https://www.scribd.com/doc/204585248/Study-of-Intel-Corporation',
  },
  'groq': {
    description: 'Designs LPU (Language Processing Unit) AI inference chips as an alternative to traditional GPU designs. Groq\'s LPU has demonstrated the ability to run enterprise-scale language models with 70 billion parameters at record speed. In a benchmark conducted by ArtificialAnalysis.ai, the Groq LPU outperformed eight top cloud providers in latency and throughput, positioning it as a rival to NVIDIA, AMD, and Intel for inference workloads.',
    source: 'https://www.kavout.com/blog/groq-lpu-chip-a-game-changer-in-the-high-performance-ai-chip-market-challenging-nvda-amd-intel/',
  },
  'samsung-foundry': {
    description: "Samsung's contract chipmaking arm; manufactures system semiconductors for fabless customers using cutting-edge sub-3 nm GAA (Gate All Around) process technology. Samsung Foundry is accelerating EUV adoption for mass production and building a new Taylor, Texas fab to expand its global footprint. Its SAFE program enables customer SoC design through Samsung's library, PDK, and design service infrastructure.",
    source: 'https://semiconductor.samsung.com/about-us/business-area/foundry',
  },
  'tsmc': {
    description: 'Pure-play foundry that manufactures chips designed by others — Apple, NVIDIA, AMD, Qualcomm — without selling any end products. TSMC holds roughly 92% of the market for the world\'s most sophisticated logic semiconductors, built on a GigaFab network using EUV lithography. Its 2026 roadmap includes mass production of the N2 node with Backside Power Delivery, keeping it the go-to partner for AI-centric chip launches like NVIDIA Blackwell-Ultra.',
    source: 'https://canvasbusinessmodel.com/blogs/how-it-works/taiwan-semiconductor-manufacturing-company-how-it-works',
  },
  'coherent': {
    description: 'Makes silicon photonics, optical transceivers, and laser systems for AI data-center networking. Coherent recently demonstrated 400+ Gbps per lane data transmission using a silicon modulator built in a production-ready silicon photonics process, paired with its InP CW high-power laser. The company\'s collaboration with Tower Semiconductor targets next-generation AI and datacenter networking markets.',
    source: 'https://www.benzinga.com/trading-ideas/movers/26/03/51413577/tower-semiconductor-stock-surges-after-coherent-silicon-photonics-breakthrough',
  },
  'lumentum': {
    description: 'San Jose-based manufacturer of optical, photonic, and commercial laser products. Lumentum\'s product line includes optical amplifiers, pump lasers, photodiodes, ultrafast lasers, and submarine components serving telecom, data center, and 3D-sensing markets. In 2025 the company partnered with NVIDIA\'s silicon photonics ecosystem to supply high-power lasers for NVIDIA Spectrum-X Photonics networking switches.',
    source: 'https://www.globaldata.com/company-profile/lumentum-holdings-inc',
  },
  'qualcomm': {
    description: 'Develops and commercializes foundational technologies for the global wireless industry. Qualcomm operates through three segments: CDMA Technologies (QCT), which supplies 3G/4G/5G integrated circuits and system software; Technology Licensing (QTL), which licenses its patent portfolio; and Strategic Initiatives (QSI). Its products span wireless voice and data communications, networking, consumer electronics, automotive, cloud, and IoT.',
    source: 'http://bullfincher.io/companies/qualcomm-incorporated/overview',
  },
  'arm': {
    description: 'British multinational semiconductor and software design company headquartered in Cambridge, England. Arm\'s largest business is in processor IP, though it also designs software development tools under the RealView and Keil brands plus SoC infrastructure. It was founded in 1990 as a joint venture between Acorn Computers, Apple, and VLSI Technology and today licenses cores that underpin most mobile, PC, and data-center CPUs.',
    source: 'http://www.bluebird-electric.net/artificial_intelligence_autonomous_robotics/microprocessors/ARM_Holdings_PLC_Public_Limited_Company_Cambridge_UK.htm',
  },
  'synopsys': {
    description: 'Electronic Design Automation (EDA) software and IP company. Synopsys engineers develop and maintain the software used in chip design, verification, and manufacturing, increasingly incorporating AI, ML, GenAI, and cloud technologies. The company forms a duopoly with Cadence in the EDA market that is indispensable to virtually every semiconductor design firm.',
    source: 'https://careers.synopsys.com/job/bengaluru/sr-software-development-engineer-eda/44408/91539646592',
  },
  'cadence': {
    description: 'Leading provider of software tools used by engineers to design semiconductor chips — referred to as electronic design automation (EDA) software. Cadence\'s EDA solutions are indispensable to virtually every major semiconductor design company, and its reach is expanding into "electronic systems" companies that embed semiconductors in their products, such as modern automobile makers. Alongside Synopsys, the company anchors the EDA duopoly.',
    source: 'https://www.morningstar.com/company-reports/1305214-cadence-design-systems-is-a-leader-in-the-critical-eda-space',
  },
  'sambanova': {
    description: 'Builds purpose-built AI infrastructure with custom dataflow technology and Reconfigurable Dataflow Units (RDUs) for scalable inference. SambaNova delivers full-stack AI solutions from chips to models and powers sovereign AI data centers across Australia, Europe, and the UK. The company partners with Meta, Hugging Face, and national laboratories to run the largest open-source models with energy-efficient RDU hardware.',
    source: 'https://everydev.ai/developers/sambanova-systems',
  },
  'lightmatter': {
    description: 'Photonic chip startup founded by MIT alumnus Nicholas Harris. Lightmatter\'s chips use light to send signals instead of electrons, promising orders-of-magnitude higher performance and efficiency than conventional processors. The underlying technology — photonic integrated circuits — stems from a 2017 paper coauthored by Harris describing machine-learning computation via optical interference, and the test chip is designed to work with popular AI software including TensorFlow.',
    source: 'https://venturebeat.com/ai/photonics-startup-lightmatter-details-p1-its-ai-optical-accelerator-chip',
  },
  'celestial-ai': {
    description: 'Creator of the Photonic Fabric optical interconnect platform. The Photonic Fabric is the industry\'s only optical connectivity solution that enables disaggregation of compute and memory, letting each component be leveraged and scaled independently. Celestial AI raised a $175M Series C led by Thomas Tull\'s U.S. Innovative Technology Fund to scale the platform for hyperscalers constrained by power, memory, and cost.',
    source: 'https://insidehpc.com/2024/03/photonic-fabric-company-celestial-ai-closes-175m-series-c',
  },
  'd-matrix': {
    description: 'Silicon Valley-based startup specializing in AI inference chips. Unlike GPUs that focus on training, d-Matrix chips efficiently handle many simultaneous user requests after a model has already been trained, a fit for chatbots and video generators. The company has raised over $160 million — backed by Microsoft\'s venture arm — and AMD markets servers incorporating d-Matrix chips as an NVIDIA-alternative inference option.',
    source: 'https://www.ainvest.com/news/ai-chip-revolution-d-matrix-challenges-nvidia-with-innovative-inference-technology-24111010b04da69df9687d1e',
  },
  'ayar-labs': {
    description: 'Leader in optical engines for co-packaged optics (CPO), targeting scale-up networks for large-scale AI workloads. Ayar Labs\' TeraPHY optical engines let customers maximize compute efficiency and performance while reducing cost, latency, and power consumption. Its solutions are built on open standards and paired with partners like Alchip and GUC to integrate CPO into advanced ASIC design services for hyperscalers.',
    source: 'http://ayarlabs.com/news/guc-and-ayar-labs-partner-to-advance-co-packaged-optics-for-hyperscalers',
  },
  'rivos': {
    description: 'RISC-V AI chip startup acquired by Meta to accelerate its custom semiconductor roadmap. Rivos\' first server chip combines a CPU and AI accelerator optimized for LLMs and analytics, built on open RISC-V to avoid Arm licensing fees. The startup was previously valued near $2B with backing from Intel, MediaTek, and Dell, and the Meta deal is intended to help Meta begin training on Meta-designed chips by 2026.',
    source: 'https://www.linkedin.com/posts/definable-ai_meta-platforms-has-acquired-rivos-a-silicon-activity-7379090307025440768-SHVw',
  },

  // Hyperscalers
  'microsoft': {
    description: 'Runs the Azure public cloud and offers a comprehensive AI platform via Azure OpenAI, Azure Machine Learning, and Cognitive Services. Azure provides the scalability, security, and integration needed to modernize legacy systems and deliver AI services at scale to enterprises. Microsoft is OpenAI\'s primary compute partner and among the largest AI capex spenders in the industry.',
    source: 'https://www.transparity.com/azure/microsoft-azure-cloud-infrastructure-for-ai',
  },
  'google': {
    description: 'Runs Google Cloud and designs in-house Tensor Processing Units (TPUs) that power Gemini training and internal AI workloads. Alphabet has committed $175–185B in 2026 capex, focused almost exclusively on the full AI stack with TPUs as the crown jewel. Google Cloud\'s revenue surged 48% in early 2026 to a $70B annualized run rate, and Anthropic has become a major TPU customer via a multi-cloud strategy.',
    source: 'https://parameter.io/alphabet-googl-stock-google-tpu-chips-gain-ground-against-nvidia-in-ai-market',
  },
  'amazon-aws': {
    description: "Amazon's cloud division, operating the world's largest public cloud. AWS designs two custom chips for machine learning: Inferentia, a low-cost inference chip, and Trainium, focused specifically on training large ML models. AWS offers the Neuron SDK to optimize, compile, and deploy ML models onto these accelerators, letting developers reduce the cost of serving and training increasingly large models.",
    source: 'https://www.linkedin.com/pulse/aws-inferentia-trainium-nadir-riyani-0imtf',
  },
  'meta': {
    description: 'Runs AI superclusters to train and serve its open-source Llama models, now served through a pay-per-use Llama API launched at LlamaCon 2025. The Llama cloud runs on Meta\'s homegrown Open Compute hardware plus inference partners Cerebras and Groq, directly taking on OpenAI. In parallel, Meta develops the MTIA in-house accelerator, acquired the RISC-V chip startup Rivos, and reorganized its AI research groups under Superintelligence Labs in late 2025.',
    source: 'https://www.nextplatform.com/ai/2025/04/30/with-its-llama-api-service-meta-platforms-finally-becomes-a-cloud/1639833',
  },
  'oracle': {
    description: "Oracle Cloud Infrastructure (OCI) is now positioned as the fourth hyperscale cloud alongside AWS, Azure, and Google Cloud — though still fifth in market share at ~3%. Oracle has struck market-shaking deals with frontier AI model makers, including a large share of OpenAI's Stargate compute commitment. In 2025 the company reshuffled leadership, naming Clay Magouyrk (previously OCI president) and Mike Sicilia co-CEOs to focus on AI-era cloud growth.",
    source: 'https://www.techtarget.com/searchCloudComputing/news/366631471/Beyond-Stargate-Oracle-OCI-ups-cloud-infrastructure-appeal',
  },
  'apple': {
    description: 'Runs Private Cloud Compute (PCC), a cloud intelligence system designed specifically for private AI processing behind Apple Intelligence. PCC is built with custom Apple silicon servers and a hardened operating system that Apple claims is "the most advanced security architecture ever deployed for cloud AI compute at scale." Apple Intelligence first analyzes whether a request can be handled on-device and escalates to PCC for more complex queries while preserving user privacy.',
    source: 'https://www.trustedreviews.com/explainer/what-is-private-cloud-compute-4557382',
  },
  'tesla': {
    description: 'Wound down the Dojo AI training supercomputer program in 2025 amid an exodus of Dojo staff. Tesla is now firmly committed to the AI5 and AI6 chips: AI5 mainly powers its driver-assistance technology, while AI6 focuses on autonomous driving, humanoid robots, and AI training. The company\'s vertical integration spans its own silicon and a vehicle fleet generating training data.',
    source: 'https://www.iotworldtoday.com/transportation-logistics/tesla-drops-dojo-ai-training-supercomputer',
  },
  'softbank': {
    description: 'Japanese conglomerate and anchor partner in the Stargate AI infrastructure platform alongside OpenAI and Oracle. The consortium has committed $500B of investment over a 10 GW buildout and five US data-center sites, with over $400B of capital planned across the next three years. SoftBank also owns Arm and chairs the Stargate joint venture under CEO Masayoshi Son.',
    source: 'https://group.softbank/en/news/press/20250924',
  },
  'blackrock': {
    description: 'Global asset manager leading the AI Infrastructure Partnership (AIP) alongside Microsoft, MGX, NVIDIA, and xAI. AIP, anchored by BlackRock\'s Global Infrastructure Partners arm, invests in new and expanded AI data-center and enabling infrastructure. Energy partners GE Vernova and NextEra Energy collaborate with AIP to power the build-out.',
    source: 'https://www.blackrock.com/corporate/newsroom/press-releases/article/corporate-one/press-releases/ai-infrastructure-partnership',
  },

  // Neoclouds
  'coreweave': {
    description: 'Leading provider of high-performance GPU cloud infrastructure tailored for AI, machine learning, and advanced compute tasks. CoreWeave IPO\'d in March 2025 at a $27B valuation with a $15.1B backlog and Morgan Stanley, J.P. Morgan, and Goldman Sachs as lead underwriters. Its deep partnership with NVIDIA and custom solutions for Microsoft and Meta have driven a first-mover advantage, though the company carries a high $6.9B free-cash-flow burn for 2024 and client-concentration risk.',
    source: 'https://prezi.com/p/51ozxjflbssr/coreweave-analyzing-the-future-of-gpu-cloud-infrastructure',
  },
  'nebius': {
    description: 'Amsterdam-based neocloud offering NVIDIA-backed AI cloud infrastructure and hardware capacity as a service. Nebius is scaling aggressively — Q4 capex hit $2.1B, up from $416M a year earlier — as it races to meet surging AI demand. In 2025 the company secured a $3B deal with Meta and has undercut rivals like CoreWeave on extended H100 rentals by 30–40%.',
    source: 'https://theoutpost.ai/news-story/nebius-group-capex-jumps-to-2-1-billion-as-ai-cloud-firm-expands-gpu-and-data-center-footprint-23757',
  },
  'lambda': {
    description: 'GPU cloud infrastructure provider for AI research and development, offering on-demand NVIDIA H100 and H200 GPUs. Lambda raised a $320M Series C led by the US Innovative Technology Fund (USIT), with participation from B Capital, SK Telecom, T. Rowe Price, and existing investors Crescent Cove, Mercato Partners, and Bloomberg Beta. The company is narrower and AI-focused versus broader clouds like AWS, specializing in deep-learning training and research workloads.',
    source: 'https://www.itresearchonline.com/lambda-raises-320-million-for-gpu-cloud-focused-on-ai',
  },
  'cerebras': {
    description: 'Sunnyvale-based AI chip maker that pioneered wafer-scale integration for deep-learning accelerators. The Wafer-Scale Engine (WSE-2) is the industry\'s largest AI processor, deployed in Cerebras\' CS-2 systems as standalone units and as accelerators in large-scale AI data centers. Cerebras introduced the WSE in 2019, overcoming both lithography and yield limits to commercialize wafer-scale computing, and has since won a SEMI Award for its accelerator technology.',
    source: 'https://www.electronicspecifier.com/news/awards/cerebras-systems-wins-semi-award-for-ai-accelerator-technology/',
  },
  'nscale': {
    description: 'UK-based technology company founded in 2024, specializing in AI-optimized cloud infrastructure and HPC. Nscale is headquartered in London with data centers in Glomfjord, Norway, and offers public/private cloud, serverless inference, GPU clusters, and AI development tools on renewable-energy-powered infrastructure. In partnership with Microsoft, NVIDIA, and OpenAI, Nscale is expanding a 50 MW AI campus in Loughton, UK with a long-term plan to deploy 300,000 NVIDIA GPUs worldwide.',
    source: 'https://engtechnica.com/nscale-expands-uk-ai-infrastructure-with-stargate-platform',
  },
  'crusoe': {
    description: "Operates clean-power AI data centers aligning the future of computing with the climate. Crusoe's 200 MW AI data center at the Lancium Clean Campus near Abilene, Texas is the first phase of a 1.2 GW buildout and hosts the Stargate Abilene campus. The data halls are optimized for direct-to-chip liquid cooling and rear-door heat exchangers, leveraging local renewable energy sources to minimize environmental impact.",
    source: 'https://www.datacentermap.com/usa/texas/abilene/abilene-clean-campus',
  },
  'iren': {
    description: 'Formerly bitcoin miner Iris Energy; now operates a 750 MW campus in Childress, Texas hosting NVIDIA GB300 GPUs. IREN signed a five-year, ~$9.7B GPU cloud services agreement with Microsoft in November 2025 to deliver large-scale AI computing capacity through 2026. The company is constructing four new liquid-cooled data-center facilities (Horizon 1–4) to support 200 MW of AI compute load and has secured $3.6B of GPU financing for the Microsoft contract.',
    source: 'https://ts2.tech/en/from-bitcoin-miner-to-ai-cloud-powerhouse-iris-energys-meteoric-rise-iren-stock-soars-on-9-7b-microsoft-deal',
  },

  // AI labs
  'openai': {
    description: 'Research lab focused on developing safe and beneficial artificial intelligence. OpenAI is the creator of the GPT family of large language models behind ChatGPT and the GPT Store platform launched in 2024 for custom GPTs. The lab has become the largest single buyer of AI compute, anchoring the Stargate infrastructure commitment with Oracle and SoftBank, and has recently acquired Jony Ive\'s io Products to develop consumer AI hardware.',
    source: 'https://allgpts.co/blog/customizing-chatgpt-with-openai-gpt-com',
  },
  'anthropic': {
    description: 'AI safety and research company; builds the Claude family of large language models. Claude 3.5 Sonnet combines speed, efficiency, and advanced capabilities with a strong focus on safety, underpinned by Anthropic\'s Constitutional AI approach. The models excel at graduate-level reasoning (GPQA), undergraduate knowledge (MMLU), and coding benchmarks (HumanEval), and Anthropic runs compute multi-cloud across AWS, Google Cloud, and NVIDIA infrastructure.',
    source: 'https://www.devopsschool.com/blog/anthropic-claude-3-5-sonnet-large-language-model-llm',
  },
  'xai': {
    description: "Elon Musk's AI lab; trains the Grok family of models on the Colossus supercluster in Memphis. Colossus is the world's largest AI training cluster with over 100,000 NVIDIA H100 GPUs online in 2025 and plans to reach 300,000+ in 2026. The cluster integrates with X (formerly Twitter) for real-time training data, which Musk argues gives Grok an edge in raw compute and recency against OpenAI, Google, and Meta.",
    source: 'https://grokmuskworld.com/xai-colossus-supercomputer-2026-grok-5-training',
  },
  'io-products': {
    description: "Jony Ive's AI hardware startup; acquired by OpenAI in July 2025 to build ChatGPT hardware devices. The $6.5B deal closed after OpenAI temporarily rebranded the company from \"io\" to \"io Products\" amid a trademark lawsuit from iyO, a Google-backed rival startup. Jony Ive and his design firm LoveFrom remain independent but hold deep design and creative responsibilities across OpenAI's product surface.",
    source: 'https://www.bgr.com/business/chatgpt-hardware-confirmed-as-openai-closes-6-5b-deal-for-jony-ive-startup',
  },

  // Data centers
  'aligned-data-centers': {
    description: "Technology infrastructure company building Scale and Build-to-Scale data centers for global hyperscale and enterprise customers. Aligned emphasizes adaptive, sustainable design and runs campuses in Northern Virginia (Sterling, Ashburn), West Jordan, Utah, Chicago, and Salt Lake City. Its patented Delta3 cooling technology and advanced supply-chain methodology target fast speed-to-market and minimal risk for high-capacity customers.",
    source: 'https://aligneddc.com/blog/aligned-data-centers-expands-presence-in-northern-virginia-with-new-sterling-hyperscale-campus',
  },
  'applied-digital': {
    description: 'Develops, builds, and operates next-generation data centers and cloud infrastructure purpose-built for High-Performance Computing (HPC) applications. Applied Digital\'s facilities are engineered for accelerated compute and offer turnkey CSaaS and GPU-as-a-Service alongside hosting. Its anchor HPC data center in Ellendale, North Dakota reached a major milestone in December 2024 with the energization of its main substation transformer, progressing toward full operational capability.',
    source: 'https://ir.applieddigital.com/news-events/press-releases/detail/114/applied-digital-announces-ellendale-hpc-data-center',
  },
  'core-scientific': {
    description: 'Crypto-mining and HPC hosting company; operates 1.2 GW of contracted power and nearly 500 MW of HPC-ready capacity. Core Scientific initially rejected CoreWeave\'s ~$1B acquisition offer as significantly undervaluing the company and instead signed hosting expansion agreements. It now hosts 382 MW of CoreWeave GPU capacity across five sites under a 12-year agreement expected to add $2B of cumulative revenue.',
    source: 'https://www.datacenterdynamics.com/en/news/core-scientific-rejects-coreweave-acquisition-offer',
  },
  'galaxy': {
    description: 'Digital-asset firm pivoting from crypto into AI infrastructure. Galaxy\'s Helios campus in West Texas, previously used for cryptomining, is being retrofitted to host 800 MW of AI/HPC capacity for CoreWeave under a 15-year lease. Galaxy closed a $1.4B project financing facility for the first-phase buildout, expected to generate over $1B in annual revenue across the life of the contract.',
    source: 'https://www.datacenterdynamics.com/en/news/galaxy-digital-closes-14bn-debt-facility-for-helios-data-center-campus-in-texas',
  },

  // Memory
  'sk-hynix': {
    description: 'South Korean memory giant that designs and produces most of its semiconductors in-house, including High Bandwidth Memory (HBM). For HBM4, SK Hynix is outsourcing logic-die manufacturing to a foundry partner widely believed to be TSMC. The sixth-generation HBM4 is targeting mass production in 2025, alongside 3D DRAM and processing-in-memory (PIM) chip roadmaps.',
    source: 'https://www.tweaktown.com/news/99240/sk-hynix-looking-for-semiconductor-engineers-48-positions-in-hbm-finfet-transistor-experts/index.html',
  },
  'micron': {
    description: 'US memory manufacturer producing HBM3E memory with >1.2 TB/s bandwidth and 30% lower power consumption than competitive offerings. Micron\'s 8-layer, 24 GB HBM3E stacks ship with NVIDIA\'s H200 Tensor Core GPU starting Q2 2024. The company is behind Samsung and SK Hynix in HBM market share but is already developing HBM4 and the SOCAMM server memory format as a path to greater share.',
    source: 'https://www.allaboutcircuits.com/news/samsung-micron-sk-hynix-lead-charge-hbm3e-dram',
  },
  'samsung-memory': {
    description: "Samsung's memory arm, producing High Bandwidth Memory (HBM) stacks for AI training and HPC workloads. Samsung HBM integrates advanced TSV-based stacking with high-throughput memory performance, delivering ultra-fast data movement for AI accelerators. Each HBM package is a thin ~1-2 cm² unit roughly 1 mm thick with multiple vertically stacked memory dies interconnected via Through-Silicon Vias.",
    source: 'https://semiconductor.samsung.com/dram/hbm',
  },

  // Equipment
  'asml': {
    description: 'Dutch company that develops, produces, and services advanced photolithography machines essential for semiconductor manufacturing. ASML holds a monopoly on extreme ultraviolet (EUV) lithography, the critical technology for producing the most advanced AI chips used by TSMC, Intel, and Samsung. The company is now expanding beyond core EUV into advanced-packaging tools for bonding and connecting multiple specialized chips, critical for AI processors and high-bandwidth memory.',
    source: 'https://finance.yahoo.com/news/asml-holding-asml-plans-expand-134738321.html',
  },
  'applied-materials': {
    description: "Founded in 1967; the world's largest supplier of semiconductor manufacturing equipment and services. Applied Materials' portfolio spans atomic layer deposition (ALD), physical vapor deposition (PVD), chemical vapor deposition (CVD), electroplating, etching, ion implantation, rapid thermal processing, chemical mechanical polishing (CMP), metrology, and wafer inspection. Wafer foundry and logic customers account for ~79% of its semiconductor system revenue, with memory (DRAM at 17%, NAND at 4%) making up most of the remainder.",
    source: 'https://www.granitefirm.com/blog/us/2024/04/18/applied-materials',
  },
  'lam-research': {
    description: 'Founded in 1980 and headquartered in Fremont, California, Lam Research designs and services semiconductor processing equipment for IC fabrication worldwide. Its product portfolio spans ALTUS tungsten deposition, SABRE copper electrochemical deposition, VECTOR plasma-enhanced CVD/ALD, SPEED HDP-CVD gapfill, and Flex/Kiyo/Syndion etch systems. Lam is particularly strong in etch and deposition for memory manufacturing, complemented by Coronus bevel clean and Metryx metrology products.',
    source: 'https://abachy.com/catalog/semiconductor-equipment/lam-research',
  },
  'tokyo-electron': {
    description: 'Japanese semiconductor equipment maker with a ~90% global share in coater/developer tools used to apply and develop photoresist on wafers. Tokyo Electron holds 100% share of the coater/developer paired with ASML EUV exposure systems. The company also supplies critical plasma etch, thermal processing, cleaning, and wafer prober tools to advanced fabs, and collaborates with ASML and imec on next-generation EUV integration.',
    source: 'http://tokiox.com/wp/tokyo-electron-provided-to-asml-next-generation-coater-developer?lang=en',
  },
  'kla': {
    description: "Pioneer in the semiconductor process control market, delivering inspection, metrology, and yield-management solutions. KLA's technology is integral to integrated circuit manufacturing — from wafer inspection through in-situ process management — and its products are used by semiconductor fabs worldwide to maintain quality and yield. The company benefits directly from innovations in AI, advanced packaging, and global semiconductor demand and continues heavy R&D investment to stay ahead.",
    source: 'https://www.monexa.ai/blog/kla-corporation-navigating-semiconductor-process-c-KLAC-2025-02-19',
  },
  'shin-etsu': {
    description: "Japanese chemical giant and the world's largest supplier of silicon wafers and photoresists for semiconductor manufacturing. Shin-Etsu develops siloxane-based SINR-series photoresists and dry-film dielectrics for wafer bonding and 3D Through-Silicon Via (TSV) applications. The company has invested $285M to expand production capacity and plans new factories for photoresist as advanced-node demand grows.",
    source: 'https://www.semimedia.cc/tag/shin-etsu-chemical',
  },
  'sumco': {
    description: "Leading Japanese supplier of semiconductor-grade silicon wafers and epitaxial wafers. SUMCO's products achieve sub-micron flatness and ultra-clean surfaces, supplying CMOS, power discrete, and memory applications. The company is the world's second-largest silicon wafer supplier after Shin-Etsu and serves customers from smartphones and televisions to power semiconductors.",
    source: 'https://www.universitywafer.com/sumco-wafers.html',
  },
  'onto-innovation': {
    description: 'Semiconductor inspection and metrology vendor spanning OCD metrology, lithography, film metrology, and process-control software. Onto Innovation applies AI and ML techniques to accelerate measurement of complex 3D structures on advanced nodes where traditional physical modeling is time-consuming. Its Dragonfly G5 inspection system targets cutting-edge advanced packaging and specialty semiconductor markets.',
    source: 'https://ontoinnovation.com/resources/ai-and-ml-in-semi-manufacturing-inspection-and-metrology',
  },
  'entegris': {
    description: 'Specialty chemicals and advanced materials handling company serving the microelectronics industry. Entegris supplies filters, specialty gases, ALD/CVD deposition precursors, photoresist chemicals, and fluid-handling systems used across the fab flow. The company\'s Digital Specialty Chemicals unit makes advanced deposition precursors — including molybdenum — critical to modern semiconductor manufacturing.',
    source: 'https://www.entegris.com/en/home/brands/digital-specialty-chemicals.html',
  },

  // Networking
  'arista': {
    description: 'Cloud networking company specializing in switches, routers, and software-defined networking (SDN) solutions for data centers and campus environments. Arista serves large enterprises, service providers, and government agencies with CloudVision management and the Linux-based Arista EOS network operating system. Founded in 2004 by Andy Bechtolsheim, David Cheriton, and Kenneth Duda, the company is a primary Ethernet switching supplier for Meta and Microsoft AI clusters and has grown via acquisitions like Big Switch Networks, Mojo Networks, and Awake Security.',
    source: 'https://tickertable.com/arista-networks',
  },
  'astera-labs': {
    description: "Provides rack-scale AI infrastructure via purpose-built connectivity silicon. Astera Labs' Intelligent Connectivity Platform integrates CXL, Ethernet, NVLink Fusion, PCIe, and UALink technologies with its COSMOS software suite for scale-up and scale-out networking. The company's Aries PCIe/CXL Smart DSP Retimers are deployed in volume across multiple generations of NVIDIA HGX, MGX, and NVL72 platforms.",
    source: 'https://www.asteralabs.com/news/astera-labs-advances-cxl-and-pcie-technology-leadership-at-fms-2024',
  },
  'mellanox': {
    description: "Israeli supplier of end-to-end InfiniBand and Ethernet interconnect solutions for servers and storage. Mellanox was acquired by NVIDIA in 2020 for ~$6.9B to combine NVIDIA's computing platform with Mellanox interconnects that powered over 250 of the world's TOP500 supercomputers. Post-acquisition, the Mellanox InfiniBand line evolved into NVIDIA's 400G+ networking generation with in-network computing algorithms for AI and HPC workloads.",
    source: 'https://ccbjournal.com/news/jones-day-advises-nvidia-in-acquisition-of-mellanox-technologies-ltd',
  },
  'cisco': {
    description: 'Enterprise networking incumbent shipping Silicon One switching ASICs for AI data-center fabrics. Its flagship Silicon One G300 delivers 102.4 terabits/sec of bandwidth and claims a 33% improvement in GPU utilization versus non-optimized network configurations. Cisco manufactures the G300 on TSMC\'s 3 nm process and pairs it with new Nexus 9000 and Cisco 8000 systems targeting hyperscalers and service providers.',
    source: 'https://vellatimes.com/cisco-silicon-one-g300-ai-networking-chip-revealed-for-ai',
  },
  'credo': {
    description: "Innovation leader in Serializer-Deserializer (SerDes) technology for 100G, 400G, and 800G data-center networks. Credo's HiWire Active Electrical Cables (AECs) deliver plug-and-play 400G connectivity that is more affordable than optical alternatives and more reliable for in-rack and inter-rack connections. The company's solutions are widely deployed in cloud, service provider, and enterprise networks, with AWS anchoring most of its revenue.",
    source: 'https://credosemi.com/news/credo-announces-production-availability-of-hiwire-active-electrical-cables/',
  },

  // Packaging
  'amkor': {
    description: "Outsourced Semiconductor Assembly and Test (OSAT) provider with a manufacturing footprint across eight countries and ~13 million sq ft of space. Amkor posted $6.7B of 2025 revenue (46% communications, 20% computing, 19% automotive and industrial) and plans ~$908M of 2026 capex. Its priority investments include a new Peoria, Arizona advanced-packaging plant — developed alongside TSMC's Phoenix fab and anchored by Apple — plus expansion in Korea.",
    source: 'https://www.sahmcapital.com/news/content/amkor-technology-publishes-investor-presentation-on-advanced-packaging-global-osat-footprint-and-growth-strategy-2026-02-24',
  },
  'ase-group': {
    description: "World's largest outsourced semiconductor assembly and test (OSAT) company by revenue. ASE holds roughly 24% share of the advanced packaging market, ahead of Amkor and Intel, and has a strategic alliance with TSMC on 2.5D/3D and fan-out packaging. The company targets $3.2B of LEAP revenue in 2026 driven by AI demand and advanced packaging.",
    source: 'https://seekingalpha.com/article/4746451-ase-technology-holding-the-undervalued-largest-osat-in-the-world',
  },

  // Power
  'constellation': {
    description: 'US nuclear operator and growing power supplier to data centers. Constellation signed 20-year PPAs with Microsoft (Three Mile Island) in September 2024 and with Meta (1.1 GW Clinton Clean Energy Center) in 2025, both for the plants\' entire output. The company is evaluating new construction or SMR permits to further expand nuclear supply to meet AI-era data-center demand.',
    source: 'https://www.datacenterdynamics.com/en/news/meta-signs-20-year-ppa-with-constellation-for-entire-output-of-illinois-nuclear-power-plant',
  },
  'talen': {
    description: "Independent power producer operating the 2,228 MW Susquehanna nuclear plant in Pennsylvania. Talen has an expanded power purchase agreement with Amazon to supply 1,920 MW of carbon-free nuclear power to AWS data centers in Pennsylvania through 2042. The campus adjacent to Susquehanna supports AWS's AI and cloud operations with baseload nuclear generation.",
    source: 'https://www.nasdaq.com/articles/talen-energy-expands-nuclear-partnership-amazon-supply-carbon-free-energy-aws-data-centers',
  },
  'kairos': {
    description: "Alameda, California-based small modular reactor (SMR) developer. Kairos is partnering with Google and the Tennessee Valley Authority to build Hermes 2, a molten-salt-cooled SMR in Oak Ridge, Tennessee expected to deliver 50 MW to the TVA grid in 2030. Google signed an agreement for seven reactors in total via Kairos, constituting one of the tech industry's largest commitments to advanced nuclear.",
    source: 'https://www.industrialinfo.com/news/article/google-to-partner-with-tva-kairos-power-for-smr-in-oak-ridge-tn--345223',
  },
  'vistra': {
    description: "US independent power producer with the nation's second-largest competitive nuclear fleet, generating over 6,500 MW of emission-free energy across four plants. Its flagship Comanche Peak is a 2,400 MW two-unit facility in Texas — one of the country's lowest-cost and highest-performing nuclear plants — powering about 1.2 million Texas homes in normal conditions. Vistra is seeking NRC approval to extend Comanche Peak's licenses through 2053, adding 20 years beyond its original permits.",
    source: 'https://powertexasforward.com/comanche-peak',
  },
  'x-energy': {
    description: 'Small modular reactor (SMR) developer backed by Amazon through a ~$500M equity investment. X-energy is developing more than 600 MW of SMR capacity in Washington and Virginia, including a four-reactor, ~960 MW project with Energy Northwest and a Dominion Energy partnership in Virginia. Amazon and X-energy have committed to bring more than 5 GW of new nuclear online in the US by 2039.',
    source: 'https://www.utilitydive.com/news/amazon-small-modular-reactor-deals-nuclear-dominion-x-energy-energy-northwest/730022',
  },
  'brookfield-renewable': {
    description: "One of the world's largest publicly traded renewable-power platforms. Brookfield signed a first-of-its-kind Hydro Framework Agreement with Google in July 2025 to deliver up to 3,000 MW of homegrown energy in the US. The initial 20-year PPAs cover Brookfield's Holtwood and Safe Harbor hydroelectric facilities in Pennsylvania, supplying Google's PJM-area operations with 24/7 carbon-free power.",
    source: 'https://bep.brookfield.com/press-releases/bepc/brookfield-and-google-sign-hydro-framework-agreement-deliver-3000-mw-homegrown',
  },
  'sage-geosystems': {
    description: "Next-generation geothermal startup founded in 2020, developing energy storage and geothermal baseload technologies. Sage is partnering with Meta to deliver up to 150 MW of new geothermal baseload power to Meta's data centers. The project — Sage's first east of the Rocky Mountains — deploys Sage's proprietary Geopressured Geothermal System (GGS) validated in the field in 2022.",
    source: 'https://www.businesswire.com/news/home/20240826755596/en/Sage-Geosystems-and-Meta-Announce-Agreement-for-Next-Generation-Geothermal-Power-Generation',
  },
  'entergy': {
    description: "Southeast US vertically integrated utility serving Louisiana, Mississippi, Arkansas, and Texas. Entergy is funding new power infrastructure — including new gas-fired power plants and transmission lines — to support Meta's up-to-5 GW hyperscale AI data center in Richland Parish, Louisiana. The Louisiana PSC approved the buildout in August 2025, with Meta fully funding the energy infrastructure under the deal.",
    source: 'https://constructionreviewonline.com/meta-entergy-to-fund-energy-infrastructure-for-louisiana-data-center-in-landmark-utility-deal',
  },

  // Server OEMs
  'dell': {
    description: "Enterprise server OEM and lead integrator for the xAI Colossus cluster in Memphis. Dell is finalizing a $5B+ deal to supply xAI with NVIDIA GB200-based AI servers, each containing 36 Grace Blackwell Superchips across 16 compute trays. Analysts estimate Dell's AI server sales will reach $14B in the year through January 2026.",
    source: 'https://siliconangle.com/2025/02/14/report-dell-close-inking-5b-ai-server-deal-xai/',
  },
  'hpe': {
    description: "Enterprise infrastructure vendor delivering AI-native servers and networking. HPE acquired Juniper Networks for $18.6B to build a full-stack AI-driven networking platform, integrating Juniper's Mist AI for self-driving network optimization. The combined offering strengthens HPE's ability to serve enterprise and service-provider segments where demand for AI-enhanced networking solutions is surging.",
    source: 'https://www.monexa.ai/blog/hewlett-packard-enterprise-hpe-juniper-acquisition-HPE-2025-07-29',
  },
  'foxconn': {
    description: "Taiwan-based contract manufacturer; assembles NVIDIA GB200 systems at scale through its Ingrasys subsidiary. Foxconn and NVIDIA are jointly building Taiwan's fastest supercomputer — the Hon Hai Kaohsiung Super Computing Center — using 64 racks of GB200 NVL72 servers (4,608 Tensor Core GPUs, 90+ exaflops). The first phase went operational in mid-2025 with full Blackwell deployment in 2026.",
    source: 'https://www.tweaktown.com/news/100969/nvidia-foxconn-to-build-taiwans-fastest-supercomputer-with-blackwell-gb200-nvl72-ai-servers/index.html',
  },
  'zt-systems': {
    description: "Hyperscale systems design and ODM house for GPU rack systems, acquired by AMD for $4.9B in 2024 (75% cash, 25% stock). AMD retains ZT's systems design capabilities focused on Instinct AI GPUs, EPYC CPUs, and partner networking, while spinning out and selling ZT's manufacturing assets. The deal accelerates AMD's \"above the chip\" systems capability as it chases its share of a projected $400B AI accelerator market by 2027.",
    source: 'https://www.forbes.com/sites/patrickmoorhead/2024/08/19/amd-boosts-gpu-server-design-capabilities-with-zt-systems-acquisition',
  },
  'super-micro': {
    description: 'High-efficiency server vendor that skyrocketed to prominence as the primary hardware partner of the generative AI buildout. Super Micro claims over 30% of the market for liquid-cooled data-center deployments and is moving toward "Total IT Solution" rack-scale AI offerings. The company faced a year of governance crises and regulatory scrutiny in 2024 that still affects its valuation relative to peers.',
    source: 'https://markets.financialcontent.com/stocks/article/finterra-2026-1-22-the-liquid-cooled-titan-a-deep-dive-into-super-micro-computer-smci',
  },

  // Foundry
  'globalfoundries': {
    description: "Pure-play foundry formed in 2009 via Mubadala's investment in AMD; now the world's third-largest advanced semiconductor manufacturer. GlobalFoundries supplies chips to leading US companies including Apple and General Motors. The company has committed $16B to expanding its New York and Vermont fabs, strengthening US-based semiconductor manufacturing and supporting over 20,000 direct and indirect jobs.",
    source: 'https://www.uaepreferred.com/perspectives/uae-backed-globalfoundries-plans-16bn-us-semiconductor-investment',
  },
  'umc': {
    description: "Taiwanese pure-play semiconductor foundry manufacturing integrated circuits for fabless customers. UMC specializes in mature and specialty process technologies such as 22 nm, 28 nm, and 40 nm+ nodes — a defensible niche against TSMC's bleeding-edge focus. UMC is one of the \"Big 3\" dedicated foundries alongside TSMC and SMIC and benefits from AI-adjacent demand for peripherals, sensors, and power-management ICs.",
    source: 'https://www.dcfmodeling.com/blogs/history/umc-history-mission-ownership',
  },
  'smic': {
    description: "China's largest semiconductor foundry; mass-produces 7 nm chips via its N+1 process starting Q4 2020. SMIC's 7 nm node delivers a 20% performance gain, 63% higher logic density, and 55% smaller die area versus 14 nm — all achieved without EUV lithography. The company ranks among the world's top-three foundries by volume and has been subject to US export controls limiting its access to advanced equipment.",
    source: 'https://wccftech.com/chinese-semiconductor-manufacturer-smic-to-introduce-7nm-node',
  },
  'tower-semiconductor': {
    description: 'Israeli specialty analog foundry based in Migdal Haemek, expert in RF, power, silicon germanium (SiGe), and industrial sensors. Tower was the target of a $5.4B Intel acquisition agreement intended to bolster Intel Foundry Services, though the deal was eventually blocked by regulators in 2023. Tower continues to operate fabs in Israel, the US, and Japan, serving specialty/analog customers on mature nodes.',
    source: 'https://www.semiconductor-today.com/news_items/2022/feb/intel-tower-160222.shtml',
  },

  // Investor (generic consortium bucket — no external source)
  'multiple': {
    description: 'Consortium of multiple investors listed in a single transaction. Used in the dataset as a placeholder when a deal involves several unnamed or diverse investors. Not a standalone company profile.',
    source: null,
  },
}
