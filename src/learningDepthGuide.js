import { depthFor as baseDepthFor } from './learningDepth.js'

const EXTRA_DEPTH = {
  sociology: {
    'crime-social-construction': {
      depth: [
        'Crime and deviance must be separated carefully. Crime is conduct prohibited by criminal law, while deviance is behaviour that breaks social norms. An act may therefore be criminal but not strongly deviant, deviant but not illegal, both, or neither. This distinction lets sociologists study how definitions are created rather than assuming harmful behaviour is automatically criminalised.',
        'Becker argues that social groups create rules and apply them selectively. His idea of moral entrepreneurs is useful for explaining how campaigns, institutions or powerful groups can influence what becomes defined as deviant and which behaviours receive attention.',
        'Lemert develops labelling through primary and secondary deviance. Primary deviance is the initial rule-breaking. Secondary deviance can emerge when public reaction changes the person’s identity, relationships and opportunities. This can contribute to a deviant career, although labelling does not automatically cause further offending.',
        'Stanley Cohen’s study of Mods and Rockers shows how media amplification can create folk devils and moral panics. Selection, exaggeration and repetition can increase public concern, produce calls for control and attract stronger policing, which may itself increase the visibility of deviance.',
        'A-level evaluation should ask who has the power to define behaviour, whether the reaction is proportionate to the actual harm, and whether the theory explains the first act or mainly the consequences of social reaction.'
      ],
      evidence: ['Becker: rule creation, labelling and moral entrepreneurs.', 'Lemert: primary and secondary deviance.', 'Stanley Cohen: Mods and Rockers, folk devils and moral panic.', 'Jock Young: deviance amplification among marijuana users.', 'Use contemporary examples only as illustration alongside sociological evidence.'],
      analysis: ['Can the same behaviour be labelled differently across groups or periods?', 'Does labelling explain offending or official reactions more convincingly?', 'How can media attention change policing and recorded crime?', 'Whose interests are served by a particular definition of deviance?']
    },
    'crime-patterns-measurement': {
      depth: [
        'Police-recorded crime measures offences known to and recorded by the police, not all offending. Reporting rates, police priorities, recording rules, law changes and detection practices can all alter the figures. Official statistics are therefore social products as well as measurements.',
        'Victim surveys can reveal offences that never reached police records and help estimate the hidden figure of crime. Their limitations include memory, willingness to disclose, sampling and the exclusion or weak coverage of some offences and populations.',
        'Self-report studies ask people about their own offending. They can reveal undetected offences and challenge stereotypes produced by official data, but answers may be affected by exaggeration, concealment, memory and unrepresentative samples.',
        'Cicourel argued that criminal justice professionals use typifications, or taken-for-granted ideas about what a typical offender looks like. These judgements can shape who is stopped, questioned or processed and therefore influence official patterns.',
        'Class, gender, ethnicity and age patterns should never be explained with a single cause. Behaviour, victimisation, reporting, policing, surveillance, opportunity, socialisation, deprivation and institutional practice may all contribute.'
      ],
      evidence: ['Crime Survey for England and Wales: victimisation data distinct from police-recorded crime.', 'Cicourel: typifications and social production of crime statistics.', 'Heidensohn and Carlen help explain gender patterns.', 'Left realism can explain some patterns through relative deprivation and marginalisation.', 'Current ONS, Ministry of Justice and Welsh Government evidence should be checked before using precise figures.'],
      analysis: ['What exactly does this statistic measure?', 'Could a change in reporting or policing create the pattern?', 'How might class, gender, ethnicity and age intersect?', 'Is a pattern evidence of offending, criminal justice processing, or both?']
    },
    'crime-theories': {
      depth: [
        'Durkheim sees some deviance as inevitable and potentially functional because it clarifies moral boundaries and can encourage social change. Merton adds strain theory, arguing that unequal access to legitimate means can push some people towards innovation and other adaptations.',
        'Albert Cohen explains delinquency through status frustration, while Cloward and Ohlin argue that illegitimate opportunities are also unequally distributed. Their criminal, conflict and retreatist subcultures show why different neighbourhood conditions may produce different responses.',
        'Marxist theories focus on capitalism, ownership, law creation and selective enforcement. Neo-Marxists such as Taylor, Walton and Young combine structural inequality with meanings, choices and social reaction in a fully social theory of deviance.',
        'Interactionists shift attention to labels, discretion and official processing. Their strength is explaining how deviance becomes socially recognised; their weakness is that they can say less about the original cause of serious harmful acts.',
        'Right realism stresses rational choice, opportunity, guardianship and control. Left realism takes victimisation seriously while linking some crime to relative deprivation, marginalisation and subculture. Their policy implications therefore differ sharply.',
        'Feminist theories challenge male-centred criminology. Heidensohn focuses on patriarchal control, Carlen on class and gender deals, and Messerschmidt links some offending to the accomplishment of masculinity.',
        'Postmodern approaches emphasise fragmented identities, consumer culture, excitement, media and globalised forms such as cybercrime. They broaden criminology but can be difficult to test and may understate persistent structural inequality.'
      ],
      evidence: ['Durkheim: functions and inevitability of deviance.', 'Merton: strain and adaptations.', 'Albert Cohen: status frustration.', 'Cloward and Ohlin: illegitimate opportunity structures.', 'Taylor, Walton and Young: fully social theory of deviance.', 'Lea and Young: left realism and square of crime.', 'Right realism: rational choice, routine activity and situational prevention.', 'Heidensohn, Carlen and Messerschmidt: gender and crime.'],
      analysis: ['Which theory best explains the initial act?', 'Which theory best explains why some groups are more likely to be processed by criminal justice agencies?', 'Does the theory explain violent, property, corporate and cybercrime equally well?', 'What policy response follows logically from the theory?', 'What evidence would seriously weaken the explanation?']
    },
    'crime-policy-evaluation': {
      depth: [
        'Policy is easier to evaluate when the assumed cause is made explicit. Situational prevention and target hardening assume opportunity matters; social-investment responses assume deprivation or exclusion matter; diversion assumes formal labelling may worsen offending.',
        'Right-realist policies often aim to increase the effort or risk of offending through guardianship, surveillance, target hardening and deterrence. They can reduce opportunities quickly but may displace crime rather than remove underlying motivation.',
        'Left-realist policy combines accountable policing with action on marginalisation and relative deprivation. It addresses victims and social causes but can be expensive, slow and difficult to evaluate.',
        'Interactionist approaches encourage diversion and reduced unnecessary criminalisation. Feminist approaches ask whether policy recognises domestic abuse, sexual violence and gendered control. Marxist approaches question whether harmful acts by powerful organisations receive equal attention.',
        'Evaluation should distinguish changes in recorded crime from changes in underlying behaviour. A successful policy may increase recorded crime if reporting improves, while a failed policy may make figures fall if victims stop reporting.'
      ],
      evidence: ['Situational crime prevention and target hardening.', 'Left realist community and social-investment approaches.', 'Diversion and decriminalisation as responses to labelling concerns.', 'Gender-sensitive responses to domestic and sexual violence.', 'Corporate regulation and scrutiny of powerful offenders.'],
      analysis: ['What cause is this policy assuming?', 'What outcome would count as success?', 'Could displacement or increased surveillance create unintended effects?', 'Does the policy address causes, opportunities, victims or official reaction?', 'Who is most affected by the policy?']
    },
    'methods-design': {
      depth: [
        'Operationalisation turns an abstract concept such as fear of crime, deprivation or school engagement into observable indicators. Poor operationalisation threatens validity because the research may measure something different from the intended concept.',
        'Questionnaires can generate comparable quantitative data efficiently, while interviews provide depth and meaning. Observation may capture behaviour directly; focus groups reveal interaction; documents and secondary data can provide large-scale or historical evidence. No method is automatically best.',
        'Sampling choices must fit the research population. Random and stratified approaches can strengthen representativeness if a sampling frame exists. Snowball, purposive, quota, volunteer and opportunity samples may be more practical but create different biases.',
        'Ethics must be applied to the exact study. Informed consent, confidentiality, anonymity, protection from harm, right to withdraw, vulnerable groups and sensitive topics all affect both participants and data quality.',
        'Practical constraints such as cost, time, researcher skill, access and gatekeepers can reshape the final sample and method. A strong design anticipates these problems and explains how they affect validity, reliability or representativeness.',
        'Positivists tend to value measurable patterns, reliability and comparability. Interpretivists value meanings and validity. Methodological pluralism and triangulation can combine forms of evidence, although more methods also mean more resources and potential contradictions.'
      ],
      evidence: ['Operationalisation links concepts to measurable or observable indicators.', 'Probability sampling can strengthen representativeness where suitable frames exist.', 'Snowball sampling can help reach hidden populations but may reproduce network bias.', 'Researcher effect and social desirability can weaken validity.', 'Triangulation compares evidence from more than one method or source.'],
      analysis: ['Why does this method suit this exact research aim?', 'What type of data will it produce?', 'What is the most serious likely problem and what impact will it have?', 'How could the design reduce that problem?', 'Would a different method produce a different understanding?']
    },
    'inequality-patterns': {
      depth: [
        'Social differentiation describes social differences; stratification describes structured ranking; inequality concerns unequal access to resources, opportunities, power, status and life chances. Keeping these concepts separate improves precision.',
        'Class inequality can be examined through income, wealth, education, employment, housing, health and political influence. Wealth is accumulated assets, while income is a flow of money over time; the two can produce very different pictures of advantage.',
        'Gender inequality includes horizontal and vertical occupational segregation, pay, unpaid domestic labour, caring responsibilities, representation and safety. A pay gap is a pattern requiring explanation, not proof of one single cause.',
        'Ethnic inequalities vary sharply between groups. Discrimination, institutional practices, class position, migration history, locality and education can all contribute. Broad categories should not be treated as internally identical.',
        'Age inequality changes across the life course. Younger groups can face insecure work and housing barriers while older groups may face age discrimination, health inequalities or pension differences.',
        'Intersectionality is essential at A level because class, gender, ethnicity and age interact. Averages can conceal very different experiences within each category.'
      ],
      evidence: ['Use current ONS and Welsh Government data for contemporary patterns.', 'Income and wealth measure different dimensions of economic inequality.', 'Horizontal and vertical segregation help analyse gendered work patterns.', 'Social mobility can be intergenerational or intragenerational.', 'Welsh evidence can be used for poverty, health, education, housing and regional inequality.'],
      analysis: ['What dimension of inequality is being measured?', 'Does the same group experience advantage in one area and disadvantage in another?', 'How do categories intersect?', 'Could definitions or data collection shape the pattern?', 'Which explanation best accounts for persistence or change?']
    },
    'inequality-theories': {
      depth: [
        'Davis and Moore argue that differential rewards can motivate people to train for and fill socially important roles. Critics question how functional importance is measured and whether high rewards reflect merit, scarcity, inheritance or power.',
        'Marx links inequality to ownership of the means of production and exploitation of labour. Neo-Marxists retain class conflict while adding complexity around culture, ideology, the state and changing class structures.',
        'Weber offers a multidimensional model. Class concerns market position, status concerns social honour and party concerns organised power. Neo-Weberians develop ideas such as social closure, credentials and professional monopolies.',
        'Feminist theories argue that gendered institutions and patriarchal relations shape work, unpaid labour, power and violence. Liberal, radical and socialist feminisms disagree about causes, while intersectional feminism stresses combined inequalities.',
        'The New Right emphasises markets, incentives, individual responsibility and family behaviour. Critics argue this can understate low pay, discrimination, regional inequality and structural barriers.',
        'Postmodernists emphasise fragmented identities, diversity, consumption and lifestyle. Their challenge to fixed class identities is useful, but material inequalities in wealth, housing and life chances remain strong counter-evidence.'
      ],
      evidence: ['Davis and Moore: differential rewards and role allocation.', 'Marx: ownership, exploitation and class conflict.', 'Weber: class, status and party.', 'Neo-Weberian social closure and credentials.', 'Feminist concepts of patriarchy, paid/unpaid labour and intersectionality.', 'New Right debates about incentives and dependency.', 'Postmodern focus on identity, diversity and consumption.'],
      analysis: ['Does the theory explain distribution of resources or mainly justify it?', 'How well does it explain inequalities beyond class?', 'What evidence supports the causal mechanism?', 'Can the theory explain both persistence and change?', 'Which theory handles intersectionality most effectively?']
    }
  },
  law: {
    'criminal-liability': {
      depth: [
        'Actus reus can consist of conduct, circumstances, consequences or omissions. Omissions only create liability where a legal duty exists, for example through statute, contract, relationship, assumption of care, creation of danger or public office.',
        'Factual causation uses the but-for test. R v White demonstrates that if the result would have occurred anyway, factual causation is not established. Legal causation then asks whether the defendant remained a substantial and operating cause.',
        'R v Pagett illustrates that reasonable actions of third parties responding to the defendant may not break causation. R v Blaue supports the thin-skull rule: the defendant takes the victim as found, including personal characteristics or beliefs.',
        'Direct intention means the consequence is the defendant’s aim or purpose. R v Woollin is central to oblique intention, where a jury may infer intention from virtual certainty and the defendant’s appreciation of it.',
        'R v G establishes subjective recklessness: the defendant must foresee a risk and unreasonably take it. This reinforces the importance of fault rather than imposing liability solely because a risk would have been obvious to a reasonable person.',
        'Strict liability is controversial because Parliament may remove the need for mens rea for part of an offence. Gammon provides a key approach. The policy case is regulatory effectiveness and public protection; the objection is punishment without moral fault.'
      ],
      evidence: ['R v White: factual causation.', 'R v Pagett: legal causation and third-party response.', 'R v Blaue: thin-skull rule.', 'R v Woollin: oblique intention.', 'R v G: subjective recklessness.', 'Gammon (Hong Kong) Ltd v A-G of Hong Kong: strict liability.', 'Prosecution generally bears the burden and must prove guilt beyond reasonable doubt.'],
      analysis: ['Is there a voluntary act or legally recognised omission?', 'Has factual causation been proved before legal causation is considered?', 'What exact mens rea does the offence require?', 'Would strict liability improve enforcement at an unacceptable cost to fault-based justice?']
    },
    'criminal-offences-defences': {
      depth: [
        'Murder requires unlawful killing with intention to kill or cause grievous bodily harm. Voluntary manslaughter begins with murder liability but reduces it through a partial defence such as loss of control or diminished responsibility.',
        'Involuntary manslaughter has different routes. Unlawful-act manslaughter requires an unlawful and objectively dangerous act causing death with mens rea for the base offence. Gross-negligence manslaughter requires duty, breach, causation, risk of death and negligence so gross that criminal liability is justified.',
        'Non-fatal offences must be distinguished by harm and mens rea: assault, battery, ABH under s.47 OAPA 1861, s.20 wounding/GBH and s.18 wounding/GBH with intent. Do not assume greater injury automatically proves the higher offence without the required mental element.',
        'Theft under s.1 Theft Act 1968 requires dishonest appropriation of property belonging to another with intention permanently to deprive. Robbery adds force or threat of force used immediately before or at the time of stealing and in order to steal.',
        'Burglary under s.9 has two routes. Section 9(1)(a) focuses on entry as a trespasser with specified intent; s.9(1)(b) focuses on stealing/attempting to steal or inflicting/attempting GBH after entry as a trespasser.',
        'Insanity, automatism, intoxication, self-defence and duress each have separate tests. Non-insane automatism requires total loss of voluntary control caused by an external factor. Duress is unavailable for murder and attempted murder.',
        'Attempts under the Criminal Attempts Act 1981 require conduct more than merely preparatory plus the appropriate mens rea. Impossibility does not automatically prevent attempt liability.'
      ],
      evidence: ['Theft Act 1968: theft, robbery and burglary.', 'Offences Against the Person Act 1861: ABH, wounding and GBH.', 'Coroners and Justice Act 2009: modern partial defences to murder.', 'M’Naghten rules: insanity.', 'Criminal Attempts Act 1981: attempts.', 'Self-defence requires an honest belief in necessity and reasonable force in the circumstances as believed.'],
      analysis: ['Which offence is the strongest one supported by every required element?', 'Is there a lower alternative if one element of the more serious offence fails?', 'Does the defence remove liability, reduce liability or fail on one condition?', 'For homicide, have murder, partial defences and involuntary routes been kept separate?']
    },
    'human-rights-framework': {
      depth: [
        'The European Convention on Human Rights provides the international framework, while the Human Rights Act 1998 gives Convention rights important domestic effect. The HRA does not make the UK constitution identical to a codified constitution and does not remove parliamentary sovereignty.',
        'Section 3 requires courts, so far as possible, to interpret legislation compatibly with Convention rights. Higher courts can issue declarations of incompatibility where compatible interpretation is not possible, but they do not simply strike down Acts of Parliament.',
        'Article 8 protects private and family life, home and correspondence. Article 10 protects freedom of expression. Article 11 protects peaceful assembly and association. All three are qualified rights and can be restricted where the interference is lawful, pursues a legitimate aim and is necessary and proportionate.',
        'Proportionality asks whether the objective is sufficiently important, whether the measure is rationally connected to it, whether a less restrictive approach could be used and whether a fair balance has been struck.',
        'Privacy and expression frequently conflict. A strong answer does not assume one right always wins; it compares the importance of the information, public interest, expectation of privacy, consequences and proportionality.',
        'Police powers, surveillance, interception, public-order controls, confidentiality, defamation and harassment all create rights questions. The central issue is often whether state or private interference is adequately justified and safeguarded.',
        'Rights can be enforced domestically through courts and judicial review, while the European Court of Human Rights provides an international route after domestic remedies are exhausted. The Equality and Human Rights Commission also has an institutional role.'
      ],
      evidence: ['Human Rights Act 1998: domestic framework.', 'ECHR Article 8: private and family life.', 'Article 10: freedom of expression.', 'Article 11: peaceful assembly and association.', 'Judicial review: legality of public-authority decisions.', 'European Court of Human Rights: international enforcement.', 'Declaration of incompatibility preserves the formal sovereignty of Parliament.'],
      analysis: ['Is the right absolute or qualified?', 'What interference has occurred?', 'Is there a clear legal basis and legitimate aim?', 'Is the interference proportionate?', 'Would stronger judicial protection improve rights or weaken democratic accountability?']
    },
    'law-evaluation': {
      depth: [
        'Unit 4 evaluation needs explicit criteria. For criminal law these can include fault, clarity, consistency, moral blameworthiness, public protection, codification and need for reform. For human rights they can include proportionality, access to remedies, democratic legitimacy and the balance between courts and Parliament.',
        'Criminal law reform debates include the complexity of homicide, the age and language of non-fatal offences, the insanity rules, strict liability and the value of codification. Each criticism should be linked to a practical consequence rather than treated as an abstract complaint.',
        'Human-rights evaluation includes whether the HRA brings rights home effectively, whether declarations of incompatibility are strong enough, the influence of Strasbourg, the balance between Articles 8 and 10, and whether police/public-order powers have sufficient safeguards.',
        'A balanced evaluation distinguishes a defect in a rule from a difficult case. A law can produce a controversial outcome without necessarily being badly designed; equally, repeated uncertainty can indicate a structural weakness.',
        'Reform arguments need counterarguments. Simplification may improve accessibility but reduce flexibility; stronger rights protection may improve remedies but increase judicial influence over politically contested choices.'
      ],
      evidence: ['Law Commission and statutory reform material where taught.', 'HRA 1998 and declarations of incompatibility.', 'OAPA 1861 as a common example in reform discussions.', 'M’Naghten rules as a long-standing source of criticism.', 'Strict-liability doctrine illustrates tension between regulation and fault.'],
      analysis: ['What criterion are you using to judge the law?', 'Is the problem uncertainty, unfairness, ineffectiveness or democratic legitimacy?', 'What evidence shows the problem is significant?', 'Would reform create a new difficulty?', 'Which principle should carry greatest weight in the final judgement?']
    }
  },
  history: {
    'us-government': {
      depth: [
        'Federalism means power is divided between federal and state governments. This is crucial for civil rights because states controlled areas such as education, voting administration and policing, allowing resistance even when federal institutions favoured reform.',
        'The President leads the executive but depends on legal authority, political support and administrative capacity. Congress legislates and controls finance. The Supreme Court interprets constitutional rights. Historical change often depends on interaction or conflict among these institutions.',
        'A legal turning point is not automatically a social turning point. Brown v Board could change constitutional doctrine without immediately desegregating schools; federal legislation could transform legal rights while local implementation remained uneven.',
        'Use institutional knowledge to explain pace. Ask not simply what the President did, but whether Congress supported action, whether courts supplied legal authority and whether states complied.'
      ],
      evidence: ['Federalism and state authority.', 'Executive, Congress and Supreme Court have distinct powers.', 'Brown v Board shows the importance and limits of judicial action.', 'Post-1945 federal intervention became increasingly important to civil-rights enforcement.'],
      analysis: ['Which institution could actually produce the required change?', 'Was the change legal, administrative or social?', 'What limited implementation?', 'Did institutional conflict slow or strengthen reform?']
    },
    'civil-rights': {
      depth: [
        'The 1890 starting point is characterised by Jim Crow segregation, disfranchisement, racial violence and severe inequality. This establishes the scale of continuity Kellyn must compare with later legal progress.',
        'Before 1945, strategies differed. Booker T. Washington emphasised economic advancement and accommodation, while W.E.B. Du Bois demanded political and civil equality. The NAACP used litigation and organisation, and migration reshaped Black political influence in northern cities.',
        'The Second World War increased pressure for change through military service, wartime migration, ideological claims about democracy and growing Black activism. However, wartime change did not remove segregation or racial violence.',
        'Brown v Board (1954) challenged segregated education, but implementation exposed the limits of judicial decisions without sustained federal enforcement. Montgomery, sit-ins, Freedom Rides and mass campaigns added grassroots pressure.',
        'The Civil Rights Act 1964 and Voting Rights Act 1965 were major federal achievements. Their significance lies in national legal enforcement, but formal legal equality did not automatically remove economic, housing or policing inequalities.',
        'After 1968, Black Power, urban unrest, affirmative action, school desegregation disputes and persistent inequality complicate any claim that the civil-rights struggle was complete. The strongest judgement distinguishes political/legal rights from lived social and economic equality.'
      ],
      evidence: ['Jim Crow and disfranchisement.', 'Booker T. Washington, W.E.B. Du Bois and NAACP.', 'Brown v Board of Education, 1954.', 'Montgomery Bus Boycott, Freedom Rides and wider grassroots campaigns.', 'Martin Luther King Jr and federal intervention.', 'Civil Rights Act 1964 and Voting Rights Act 1965.', 'Black Power, urban unrest and post-1968 affirmative-action/desegregation debates.'],
      analysis: ['Which was more important at each stage: courts, presidents, Congress or grassroots activism?', 'Did a turning point change law, attitudes, behaviour or all three?', 'How far did wartime pressures accelerate change?', 'Was progress after 1968 slower because the remaining inequalities were more structural?']
    },
    'superpower': {
      depth: [
        'The USA’s rise should be measured across economic, military, diplomatic and ideological power. In the 1890s it already possessed industrial strength, while the Spanish-American War and Panama Canal demonstrated expanding strategic ambition.',
        'First World War intervention showed the scale of US resources, but the inter-war era mixed economic influence with reluctance to enter permanent political and military commitments. “Isolationism” therefore needs qualification rather than being treated as total withdrawal.',
        'The Second World War transformed American military-industrial capacity and left the USA with global bases, nuclear weapons and unmatched economic strength. From 1945, containment, alliances and rivalry with the USSR made US power structurally global.',
        'Vietnam demonstrates the limits of military superiority. The USA could deploy immense force but struggled to turn it into the desired political outcome, which is essential when judging the nature rather than just the size of power.',
        'Détente reduced some tensions but did not end rivalry. Reagan’s policies formed part of the later Cold War, but Soviet economic weakness, internal reform and developments in Eastern Europe must also be considered. Avoid the monocausal claim that one leader ended the Cold War.'
      ],
      evidence: ['Spanish-American War and Panama Canal.', 'First World War and peace settlement.', 'Inter-war economic influence and non-entanglement.', 'Second World War mobilisation.', 'Containment, NATO, nuclear capability and Cold War competition.', 'Vietnam War as a limit to US power.', 'Détente, Reagan and Soviet decline by 1990.'],
      analysis: ['When did capability become sustained global leadership?', 'Was foreign policy more interventionist or simply more powerful?', 'How did war both strengthen and expose limits?', 'How far was the end of the Cold War caused by US policy rather than Soviet change?']
    },
    'breadth-judgement': {
      depth: [
        'Breadth answers need coverage across the full period set by the question. A detailed paragraph on one decade cannot compensate for weak chronological range.',
        'Choose judgement criteria before selecting evidence. Significance can be judged by scale, durability, geographical reach, pace of change or ability to trigger further developments.',
        'Turning points should be tested. Brown, the Civil Rights Act or US entry into world wars may be important, but a true turning point should change direction or pace in a durable way.',
        'Counter-evidence is part of the argument, not a separate “however paragraph”. Use it to refine the judgement and show where a factor mattered less or where continuity remained stronger.'
      ],
      evidence: ['Use evidence from the start, middle and end of the chronology.', 'Compare factors directly.', 'Link legal change to implementation where relevant.', 'Use precise dates only when they advance the argument.'],
      analysis: ['What is your criterion for significance?', 'What changed immediately and what changed later?', 'What continuity limits the claimed turning point?', 'Is the factor equally important throughout the period?']
    },
    'whig-reform': {
      depth: [
        'Whig reform after 1832 should be understood as a programme responding to political pressure, industrialisation, urban growth, administrative weakness and humanitarian concern. Motives were mixed rather than purely benevolent.',
        'The Factory Act 1833 increased state regulation of factory labour, while the Poor Law Amendment Act 1834 reorganised relief around deterrent principles. Both reveal the growth of central intervention but also the limits of enforcement and local acceptance.',
        'The Municipal Corporations Act 1835 reformed local government; civil registration from 1836 strengthened administration; education grants and policing developments increased state involvement in social organisation.',
        'Evaluation should compare intention and impact. A reform may be administratively significant while failing to reduce protest or improve conditions immediately.'
      ],
      evidence: ['Factory Act 1833.', 'Poor Law Amendment Act 1834.', 'Municipal Corporations Act 1835.', 'Civil registration from 1836.', 'Education grant and policing developments.'],
      analysis: ['Were reforms driven more by humanitarianism, efficiency, economy or social control?', 'How effectively were reforms enforced?', 'Which groups benefited or lost?', 'Did reform reduce the grievances behind protest?']
    },
    'chartism': {
      depth: [
        'Chartism united supporters around the Six Points of the People’s Charter but contained real strategic disagreement. William Lovett is associated with moral-force approaches while Feargus O’Connor became linked with more confrontational mass politics.',
        'Support expanded during economic hardship and political disappointment. The petitions showed organisational reach, while episodes such as Llanidloes, the Newport Rising and Plug Plot disturbances demonstrated both militancy and state capacity to repress protest.',
        'The rejection of petitions mattered, but failure cannot be reduced to parliamentary hostility. Leadership division, strategic disagreement, economic recovery, local variation, weak coordination and repression interacted.',
        'Immediate failure and longer-term significance must be separated. Chartism did not secure the Charter by 1848, but several demands were later adopted, and the movement demonstrated unprecedented working-class political mobilisation.'
      ],
      evidence: ['People’s Charter and Six Points.', 'William Lovett and Feargus O’Connor.', 'Three national petitions.', 'Llanidloes and Newport Rising 1839.', 'Plug Plot 1842.', 'Kennington Common 1848.'],
      analysis: ['Which cause of failure was most decisive?', 'Did economic conditions determine support more than leadership?', 'How effective was state repression compared with internal weakness?', 'Does later adoption of Charter demands make Chartism successful in a broader sense?']
    },
    'protest-wales-england': {
      depth: [
        'Opposition to the New Poor Law reflected hostility to deterrent relief, workhouses and central intervention. Local implementation varied, so resistance needs to be placed in regional context rather than treated as uniform.',
        'The Rebecca Riots in Wales combined opposition to toll gates with wider rural grievances including rents, poor harvests, poverty and local administration. Their Welsh context is central, not an optional example.',
        'The Anti-Corn Law League differed from many popular protest movements because it was highly organised, well financed and able to combine public campaigning with pressure on Parliament. This helps explain why repeal became achievable.',
        'Comparative answers should assess social base, organisation, methods, leadership, resources, state response and whether the movement’s aims aligned with influential political or economic interests.'
      ],
      evidence: ['New Poor Law opposition.', 'Rebecca Riots 1839–1843.', 'Anti-Corn Law League.', 'Chartist unrest as a comparison.', 'Government responses ranged from repression to reform.'],
      analysis: ['Why were some movements treated as threats while others gained political access?', 'How important were Welsh rural conditions to Rebecca?', 'Did organisation matter more than the justice of a grievance?', 'What is the difference between short-term concession and structural reform?']
    },
    'source-evaluation': {
      depth: [
        'Start with what the source actually says about the enquiry. Select particular claims, language or emphasis and explain their historical value before discussing provenance.',
        'Contextual knowledge should test the source. If a Chartist source claims mass unity, use knowledge of leadership division, local variation and petitioning to support, qualify or challenge that claim.',
        'Provenance matters when it changes what can be inferred. A speech aimed at supporters may exaggerate confidence, but that purpose can make it highly valuable for understanding movement rhetoric and priorities.',
        'Bias is not the same as uselessness. Every source has perspective. The key question is what the perspective allows the historian to learn and what it prevents the source from proving on its own.'
      ],
      evidence: ['Content, contextual knowledge and provenance should be integrated.', 'Value is always value for a particular enquiry.', 'Corroboration strengthens or qualifies claims.', 'Limitations should be specific rather than generic.'],
      analysis: ['What does this source reveal that another source type might not?', 'Which contextual fact most strongly tests its claim?', 'How does audience or purpose shape the message?', 'What cannot be concluded from this source alone?']
    },
    'nea-process': {
      depth: [
        'The NEA is an independent enquiry, so research quality matters as much as organisation. A precise approved question, a clear historical debate and a purposeful evidence base prevent the project becoming descriptive.',
        'Historian interpretations should be treated as arguments with evidence and assumptions, not as decorative quotations. Kellyn should identify where historians agree, disagree and use different evidence or criteria.',
        'Primary sources need contextual criticism: authorship, purpose, audience, timing, representativeness and limitations. A source log should preserve full reference details and brief evaluation at the point of research.',
        'Research, analysis, drafting, review and authentication should be kept distinct. The Hub can help manage these stages but should not write assessed passages or alter Kellyn’s historical judgement.'
      ],
      evidence: ['Approved enquiry and school instructions control the task.', 'Maintain bibliography and source log during research.', 'Compare historian interpretations as arguments.', 'Keep accurate authentication records.'],
      analysis: ['What debate is the enquiry testing?', 'Which evidence is strongest for each interpretation?', 'What source limitations affect confidence?', 'What criteria will underpin the final judgement?']
    }
  },
  'welsh-bacc': {
    'question-rationale': {
      depth: [
        'The Individual Project is 50% of the Advanced Skills Baccalaureate and is designed to demonstrate independent research and application of the Integral Skills. A viable question should be personally meaningful, researchable, ethical and manageable within the project time.',
        'The rationale should explain why the issue is worth investigating and how it connects to future education, training or career aspirations. Interest alone is not enough; the value and feasibility of the investigation should be clear.',
        'Aims describe the overall purpose. Objectives break that purpose into specific research intentions. Success criteria provide a basis for later evaluation and should be specific enough to judge.',
        'A broad topic becomes more manageable by narrowing population, place, period, relationship or issue. The final wording and key decisions must remain Kellyn’s own and be approved by her supervisor.'
      ],
      evidence: ['Individual Project: 50% of qualification.', 'Topic requires supervisor approval.', 'Question, rationale, aims and objectives should align.', 'Feasibility, ethics, access and source availability should be checked early.'],
      analysis: ['Is the question answerable through research rather than opinion?', 'Is there enough credible evidence?', 'Can the project be completed safely and ethically?', 'Will the objectives actually answer the main question?']
    },
    'research-plan': {
      depth: [
        'Planning and Organisation includes priorities, timescales, resources, risks and active monitoring. A timeline is only one part of the skill.',
        'Research method should follow the information needed. Questionnaires can provide breadth, interviews depth, focus groups interaction and secondary research established evidence. Primary research is not automatically better.',
        'Sampling, participant access, ethics and low response rates need contingency planning. A good plan explains what will happen if a key source, participant group or method becomes unavailable.',
        'The two supervisor meetings are important checkpoints. Kellyn should retain evidence of what was discussed, what feedback was given, what decisions she made and what changed afterwards.',
        'Milestones should include research, analysis, referencing, review and final checks rather than treating submission as one large deadline.'
      ],
      evidence: ['Planning and Organisation is one of the four Integral Skills.', 'Global Community, Future Destinations and Individual Project all develop the same Integral Skills.', 'Individual Project is approximately 80 hours.', 'Two supervisor meetings should be evidenced.'],
      analysis: ['What information is needed before choosing a method?', 'What is the main risk to the plan?', 'What fallback is realistic?', 'How will Kellyn know when to stop collecting and start analysing?']
    },
    'source-evaluation-ip': {
      depth: [
        'Research quality depends on judging sources, not collecting links. Authority, evidence quality, currency, relevance and purpose should be considered separately.',
        'A government or academic source can be authoritative but only partly relevant. A directly relevant social-media or campaign source can be valuable for viewpoint while weak as factual evidence. Credibility and relevance are different judgements.',
        'Bias should be analysed rather than used as a dismissal. Ask what interest or perspective shapes the source, what evidence is selected and whether other credible sources corroborate the claims.',
        'Referencing should be recorded during research. A source log should capture full details, the main claim, relevance, credibility, limitations and how the evidence may contribute to the project.'
      ],
      evidence: ['Authority, evidence quality, currency, relevance and purpose are separate tests.', 'Primary research also requires critical evaluation.', 'References should be recorded as sources are used.', 'Lateral checking and corroboration strengthen credibility judgements.'],
      analysis: ['What does the source allow Kellyn to conclude?', 'What is the strongest limitation?', 'What competing source should be checked?', 'Is the source being used for facts, interpretation or viewpoint?']
    },
    'analyse-evidence': {
      depth: [
        'Analysis means organising evidence around themes or arguments rather than summarising one source at a time. Synthesis means bringing different sources together to explain agreement, disagreement and complexity.',
        'Quantitative evidence should be interpreted: patterns, comparisons, scale and limitations matter more than simply presenting a graph. Qualitative evidence can be grouped into themes and compared across participants or sources.',
        'Contradictory evidence is useful because it tests assumptions. Strong reasoning asks which evidence is more credible, whether different methods explain the disagreement and what judgement can safely be made.',
        'Problem solving is part of the skill. If access fails, evidence is weak or the project becomes too broad, Kellyn should consider options, justify a response and record the consequence of that decision.'
      ],
      evidence: ['WJEC expects analysis, synthesis, connections and valid judgements.', 'Conclusions should be traceable to evidence.', 'The four Integral Skills include Critical Thinking and Problem Solving.', 'Limitations should affect how confidently a conclusion is expressed.'],
      analysis: ['What pattern appears across several sources?', 'Which source is strongest and why?', 'What alternative explanation fits the same evidence?', 'What can the evidence not establish?', 'What project decision follows from the analysis?']
    },
    'produce-review': {
      depth: [
        'The final review should test the project against its aims, objectives and success criteria rather than simply making it longer. Every major section should contribute to the research purpose.',
        'Self-evaluation should be evidence based. Instead of saying “I improved my planning”, identify the original difficulty, the change made, the outcome and what was learned.',
        'Personal Effectiveness is demonstrated through responsibility, response to feedback, resilience, independent decision-making and honest reflection. Evidence should come from what happened during the project.',
        'Authentication matters. Supervisor records, references, declarations and the development trail should accurately show how the work was produced and what assistance was used.',
        'For an artefact route, evaluation should connect design choices and testing to the research and success criteria. For a written route, the conclusion should answer the question using analysis already established rather than introducing new evidence.'
      ],
      evidence: ['Self-evaluation is part of the Individual Project.', 'Success criteria create a basis for final judgement.', 'Supervisor records and reference information support the evidence trail.', 'Personal Effectiveness includes independence, feedback and reflection.'],
      analysis: ['What evidence proves that a skill developed?', 'Which success criteria were achieved and which were not?', 'What limitation most affected the final outcome?', 'What would Kellyn change in a future independent project?', 'How will the skills transfer to university or employment?']
    }
  }
}

function mergeList(base = [], extra = []) {
  return [...base, ...extra]
}

export function depthFor(subjectSlug, topicSlug) {
  const base = baseDepthFor(subjectSlug, topicSlug)
  const extra = EXTRA_DEPTH[subjectSlug]?.[topicSlug]
  if (!base && !extra) return null
  if (!base) return extra
  if (!extra) return base
  return {
    ...base,
    ...extra,
    spec: extra.spec || base.spec,
    depth: mergeList(base.depth, extra.depth),
    evidence: mergeList(base.evidence, extra.evidence),
    analysis: mergeList(base.analysis, extra.analysis),
    exam: extra.exam || base.exam,
  }
}
