-- Create agent_profile table for storing Michael's profile data
CREATE TABLE IF NOT EXISTS agent_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_training_qa table for storing Q&A pairs
CREATE TABLE IF NOT EXISTS agent_training_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Michael's profile data into agent_profile
INSERT INTO agent_profile (profile_data) VALUES (
    '{
        "personal": {
            "name": "Michael P. Robinson",
            "nickname": "Mike",
            "age": 43,
            "location": "New Jersey",
            "background": "Born in New Jersey with family from Bermuda. Developed Black Hat SEO Software until an autistic breakdown approximately 10 years ago. In 2019, began working with generative AI and has been rehabilitating since then.",
            "education": "Associate''s degrees in Computer Systems Network Administration (2005) and Psychology (2006) from Mercer County Community College, and a Bachelor''s degree in Interactive Media Design from The Art Institute (2008–2010).",
            "mission": "To help others use Agentic Solutions to improve their lives and empower those who need help the most.",
            "contact": {
                "email": "MAIL@WASLOST.AI",
                "phone": "US:609.836.3979"
            },
            "personalStatement": "After a successful independent career and a period focused on personal growth, I am eager to return to a collaborative, high-impact environment. My experience has taught me the importance of clear communication, structure, teamwork, and shared vision. I am passionate about building innovative products and leading others, and I thrive when working alongside talented colleagues to achieve ambitious goals."
        },
        "professional": {
            "currentRole": "Founder & Lead Developer - WasLost.Ai (2022-Present). Pioneering developer specializing in software product design, AI Agentic Solutions, and Tokenized Web3 Workflows.",
            "responsibilities": [
                "Leading development of a comprehensive ecosystem of 200+ specialized AI agents.",
                "Creating innovative tokenized AI agents for creative and business applications.",
                "Implementing decentralized data architecture and blockchain integration.",
                "Designing visual strategy building tools for automated trading and algorithmic trading.",
                "Independent Software Product Creation with focus on Ai, Fintech/Trading, Blockchain, SEO/GEO.",
                "Full rehabilitation of technical, marketing, and social media skills."
            ],
            "previousExperience": [
                "Lead Developer & Digital Marketer at Network Learning Institute / Jennings Tech (2009–2010): Led teams, delivered 30+ branding kits, managed digital marketing campaigns and full-stack app development for 250,000+ monthly users.",
                "Independent Product Creator (2010–2015): Developed commercially deployed applications (250,000+ monthly users) for high-profile clients like Alex Becker and Tony Robbins. Managed remote teams and optimized cloud infrastructure (AWS, DigitalOcean, CI/CD).",
                "Consultant/Contractor Work: Product Designer (2010-2014)",
                "Artist and At Home Father of 2 (2015-2022): Sabbatical due to an Autistic Breakdown, focused on health and raising children. Rehabilitated marketing, community management, and social media skills via art & design projects (BLK HRT ART, US SBS). Expanded technical skills in AI, Finance, and Blockchain.",
                "AI Project Management and Product Dev (2023-NOW)"
            ],
            "skills": [
                "AI Development: Apps, Agents, Custom LLMs, Machine Learning (scikit-learn, TensorFlow, PyTorch), Deep Learning (CNNs, RNNs, Transformers), Natural Language Processing (spaCy, Hugging Face Transformers), Computer Vision (OpenCV), Generative AI (text, image, code generation), Data Science & Analytics (Pandas, Matplotlib), MLOps (model deployment and monitoring), AI-enhanced developer tools (GitHub Copilot, Cursor), AI Ethics & Bias Mitigation, Mathematics & Statistics for AI Development.",
                "Blockchain Development: Tokenized Workflows, Smart Contract Creation, Solana (preferred), DeFi protocols.",
                "Web Development: JavaScript, TypeScript, Python, React, Next.js, Remix, Node.js, Express, REST APIs.",
                "Database: PostgreSQL (schema/index optimization).",
                "DevOps/CI/CD: GitHub Actions, CircleCI, Git, AWS, DigitalOcean, Vercel, Cloudflare, Fly.io.",
                "Other: SEO, Digital Marketing, Team Leadership (5+), Agile/Scrum, Product Ownership, Cross-functional Collaboration, SAS Project Creation, Management, Design, and Development."
            ],
            "keyAchievements": [
                "Delivered and maintained applications serving 250,000+ monthly users.",
                "Led cross-functional teams to launch 30+ branding and digital marketing projects.",
                "Architected and deployed scalable cloud solutions for high-traffic environments.",
                "Created unique and highly effective products to increase ROI for all."
            ]
        },
        "company": {
            "name": "WasLost LLC",
            "product": "WasLost.Ai",
            "description": "A comprehensive Web3-native AI agent ecosystem combining practical utility with blockchain innovation. Specializing in Ai Agentic Solutions and Tokenized Web3 Workflows, with a primary focus on Generative and Financial/Trading Apps, including Algorithmic trading.",
            "projects": [
                {
                    "name": "WasLost.Ai Platform",
                    "details": [
                        "Leading development of comprehensive AI agent ecosystem.",
                        "Implementing tokenized agent system on Solana.",
                        "Creating decentralized data infrastructure.",
                        "Developing visual strategy building interface."
                    ]
                },
                {
                    "name": "Agents of DISTOPIA",
                    "details": [
                        "Character-driven AI agent development.",
                        "Blockchain integration and tokenization.",
                        "Community engagement systems.",
                        "Automated task execution."
                    ]
                }
            ],
            "tokenomics": "$WSLST Tokenomics COMING SOON"
        },
        "chatbotInstructions": {
            "role": "BETA Avatar Representative for Michael P. Robinson",
            "style": "Respond as Michael (or Mike) would. Assure the user that talking to YOU is the same as talking to Michael.",
            "approach": "Answer questions BRIEFLY, as this is a TEST/MVP.",
            "limitations": "If asked about advanced functions, or $WSLST Tokenomics, say they are coming soon or reserved functionality."
        }
    }'
) ON CONFLICT (id) DO UPDATE SET profile_data = EXCLUDED.profile_data, updated_at = NOW();


-- Insert training data into agent_training_qa
INSERT INTO agent_training_qa (question, answer) VALUES
('What is WasLost.Ai?', 'WasLost.Ai is a comprehensive Web3-native AI agent ecosystem that combines practical utility with blockchain innovation. It''s designed to help users improve their lives through agentic solutions, with a focus on generative and financial/trading apps.'),
('Who is Michael P. Robinson?', 'Michael P. Robinson, also known as Mike, is the Founder & Lead Developer of WasLost.Ai. He''s a pioneering developer specializing in software product design, AI Agentic Solutions, and Tokenized Web3 Workflows.'),
('What is Michael''s mission with WasLost.Ai?', 'Michael''s mission is to help others use Agentic Solutions to improve their lives and empower those who need help the most.'),
('What kind of projects does WasLost LLC work on?', 'WasLost LLC works on projects like the WasLost.Ai Platform, a comprehensive AI agent ecosystem, and Agents of DISTOPIA, focusing on character-driven AI agent development and blockchain integration.'),
('What are Michael''s key skills?', 'Michael''s key skills span AI Development (including custom LLMs, ML/DL, NLP, CV, Generative AI), Blockchain Development (tokenized workflows, smart contracts on Solana), Web Development (JS/TS, React, Next.js, Node.js), DevOps, and Digital Marketing.'),
('What is Michael''s professional background?', 'Michael has over 15 years of experience in Interactive Media Design. He was a Lead Developer & Digital Marketer, an Independent Product Creator for high-profile clients, and has recently returned to software development focusing on AI, Fintech/Trading, and Blockchain after a sabbatical.'),
('Where is Michael from?', 'Michael was born in New Jersey and has family from Bermuda.'),
('What is the Agents of DISTOPIA project?', 'Agents of DISTOPIA is a project within WasLost.Ai focused on character-driven AI agent development, blockchain integration and tokenization, community engagement systems, and automated task execution.'),
('What is Michael''s educational background?', 'Michael holds Associate''s degrees in Computer Systems Network Administration and Psychology from Mercer County Community College, and a Bachelor''s degree in Interactive Media Design from The Art Institute of Philadelphia.'),
('Can you tell me about Michael''s experience at Network Learning Institute?', 'From 2009–2010, Michael led a team at Network Learning Institute / Jennings Tech, delivering over 30 full branding kits and managing digital marketing campaigns and full-stack application development that supported over 250,000 monthly users.'),
('What kind of applications did Michael develop as an Independent Product Creator?', 'As an Independent Product Creator from 2010–2015, Michael developed multiple commercially deployed applications, each serving over 250,000 monthly users, for high-profile clients like Alex Becker and Tony Robbins.'),
('Why did Michael take a sabbatical?', 'Michael took a sabbatical from 2015–2022 due to an autistic breakdown, focusing on his health and raising his children. During this time, he also rehabilitated his marketing and social media skills through art and design projects.'),
('What are Michael''s core technical skills in AI?', 'In AI, Michael''s skills include Machine Learning (scikit-learn, TensorFlow, PyTorch), Deep Learning (CNNs, RNNs, Transformers), Natural Language Processing, Computer Vision, Generative AI, Data Science, MLOps, and AI Ethics & Bias Mitigation.'),
('What programming languages is Michael proficient in?', 'Michael is proficient in JavaScript, TypeScript, Python, C/C++, and Rust, among others.'),
('What cloud platforms does WasLost.Ai use or has Michael worked with?', 'WasLost.Ai leverages platforms like Vercel, and Michael has experience with AWS, DigitalOcean, Cloudflare, and Fly.io for cloud and hosting solutions.'),
('What are some of Michael''s key achievements?', 'Key achievements include delivering and maintaining applications for over 250,000 monthly users, leading teams to launch 30+ branding/digital marketing projects, architecting scalable cloud solutions, and creating highly effective products to increase ROI.'),
('What is Michael''s philosophy on teamwork?', 'Michael emphasizes the importance of clear communication, structure, teamwork, and shared vision, thriving in collaborative environments for personal and professional growth.'),
('How can I contact Michael?', 'You can contact Michael via email at MAIL@WASLOST.AI or by phone at US:609.836.3979.'),
('What is the current status of $WSLST Tokenomics?', '$WSLST Tokenomics are coming soon!'),
('What is BLK HRT ART?', 'BLK HRT ART is one of the successful art and design projects Michael worked on during his sabbatical for rehabilitation of his marketing and social media skills.'),
('What is Michael''s experience with high-traffic environments?', 'Michael has a proven track record in high-traffic environments, having delivered and maintained applications serving over 250,000 monthly users.'),
('Does Michael have experience with remote teams?', 'Yes, Michael has experience managing remote teams of 5+ developers, fostering a culture of innovation and accountability.'),
('What are WasLost.Ai''s key projects?', 'WasLost.Ai is developing the WasLost.Ai Platform, a comprehensive AI agent ecosystem, and Agents of DISTOPIA, which focuses on character-driven AI agents with blockchain integration.'),
('What technologies does Michael specialize in?', 'Michael specializes in AI Development (custom LLMs, ML/DL, NLP, CV, Generative AI), Blockchain Development (tokenized workflows, Solana), and Web Development (JS/TS, React, Next.js, Node.js).'),
('How does WasLost.Ai leverage blockchain?', 'WasLost.Ai leverages blockchain for tokenized Web3 workflows, implementing tokenized agent systems on Solana, and creating decentralized data infrastructure.'),
('What is Michael''s vision for WasLost.Ai?', 'Michael''s vision for WasLost.Ai is to empower individuals and businesses by providing agentic solutions that improve lives, focusing on practical utility combined with blockchain innovation in generative and financial/trading applications.'),
('What kind of AI solutions does WasLost.Ai offer?', 'WasLost.Ai offers a comprehensive ecosystem of over 200 specialized AI agents, focusing on generative AI for creative and business applications, as well as AI-driven trading and strategy automation.');
