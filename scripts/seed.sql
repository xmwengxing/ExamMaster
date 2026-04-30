-- ============================================================================
-- ExamMaster Seed Data
-- ============================================================================
-- This script populates the database with sample data for development and
-- testing purposes. It includes:
--   1. Sample question banks
--   2. Questions of all types (SINGLE, MULTIPLE, JUDGE, SHORT_ANSWER, FILL_IN_BLANK)
--   3. Default admin user (phone: admin, password: admin)
--   4. A sample VOD course with chapters and lessons
--   5. A sample live course with live session
--   6. Final UPDATE to fix question counts on banks
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SAMPLE BANKS
-- ============================================================================
INSERT INTO banks (id, name, category, level, description, question_count, score_config, usage_count, created_at, updated_at)
VALUES ('bank-1769162230466', '人工智能训练师', '职业技能等级', '高级工',
        '福建省人工智能训练师等级考试精准题库70%', 1237,
        '{"JUDGE": 1, "SINGLE": 1, "MULTIPLE": 2, "SHORT_ANSWER": 5, "FILL_IN_BLANK": 3}',
        0, '2026-01-23 09:57:08.911694', '2026-01-23 09:57:08.911694')
ON CONFLICT (id) DO NOTHING;

INSERT INTO banks (id, name, category, level, description, question_count, score_config, usage_count, created_at, updated_at)
VALUES ('bank-1770715976353', '初二上历史题', '初二', '初级',
        '', 92,
        '{"JUDGE": 1, "SINGLE": 2, "MULTIPLE": 4, "SHORT_ANSWER": 5, "FILL_IN_BLANK": 3}',
        0, '2026-02-10 09:32:56.35391', '2026-02-10 09:32:56.35391')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SINGLE CHOICE QUESTIONS (10)
-- ============================================================================
INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-607593-2', 'bank-1769162230466', 'SINGLE',
        '不同的历史时期,有不同的道德标准,职业道德也不例外。这表明了职业道德具有明显的( )特点。',
        '["时代性", "实践性", "多样性", "经济性"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-966070-3', 'bank-1769162230466', 'SINGLE',
        '某机械厂的一位领导说:"机械工业工艺复杂,技术密集,工程师在图纸上画得再好、再精确,工人操作中如果差那么一毫米,最终出来的就可能是废品。"这段话主要强调( )素质的重要性。',
        '["专业技能", "思想政治", "职业道德", "身心素质"]',
        '"C"', 'C', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-804666-4', 'bank-1769162230466', 'SINGLE',
        '人工智能训练师需要掌握哪些工具或平台的操作方法?( )',
        '["Python", "TensorFlow", "PyTorch", "所有以上选项"]',
        '"D"', 'D', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-746078-5', 'bank-1769162230466', 'SINGLE',
        '人工智能的主要研究内容是什么?( )',
        '["社会科学", "计算机实现智能的原理", "物理现象", "经济学理论"]',
        '"B"', 'B', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-788092-6', 'bank-1769162230466', 'SINGLE',
        '人工智能训练的主要原理是什么?( )',
        '["使用随机生成的数据", "使用数据驱动方法构建模型", "仅依赖专家知识", "忽略已知数据的特征与标签之间的关系"]',
        '"B"', 'B', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-315375-7', 'bank-1769162230466', 'SINGLE',
        '机器学习的两个重要过程是什么?( )',
        '["编程和测试", "设计和评估", "训练和预测", "分析和总结"]',
        '"C"', 'C', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-386010-8', 'bank-1769162230466', 'SINGLE',
        '逻辑回归模型通过拟合什么函数来进行预测?( )',
        '["线性函数", "逻辑函数(Sigmoid函数)", "多项式函数", "正弦函数"]',
        '"B"', 'B', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-344184-9', 'bank-1769162230466', 'SINGLE',
        '支持向量机的目标是什么?( )',
        '["将所有样本聚集在一起", "尽可能减少模型参数的数量", "找到一个最优的超平面,使不同类别样本之间的距离尽可能大", "增加不同类别样本之间的重叠"]',
        '"C"', 'C', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-420035-10', 'bank-1769162230466', 'SINGLE',
        'sklearn.preprocessing模块的主要目的是什么?( )',
        '["提供机器学习算法", "实现深度学习模型", "将原始特征向量更改为更适合下游模型算法的表示", "设计用户界面"]',
        '"C"', 'C', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244107-612524-11', 'bank-1769162230466', 'SINGLE',
        '深度学习与机器学习的关系是什么?( )',
        '["深度学习是机器学习的一个子集", "机器学习是深度学习的一个子集", "它们之间没有关系", "它们是完全相同的概念"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. MULTIPLE CHOICE QUESTIONS (10)
-- ============================================================================
INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244108-445595-57', 'bank-1769162230466', 'MULTIPLE',
        '下面哪个选项不是知识产权的特点?',
        '["有形性", "专有性", "地域性", "时间无限性"]',
        '["A", "D"]', 'AD', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244110-724081-174', 'bank-1769162230466', 'MULTIPLE',
        '关于培训的角色扮演法,描述错误的是:',
        '["宣布练习的时间限制。", "强调参与者实际作业。极速使每次角色演练都成为一次不同技巧的练习。", "大多数角色演练不能代表培训计划中所教导的行为。", "大多数角色演练不能代表培训计划中所教导的行为。大多数角色演练不能代表培训计划中所教导的行为。"]',
        '["C", "D"]', 'CD', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244113-323408-223', 'bank-1769162230466', 'MULTIPLE',
        '应用AI技术设计智能产品/系统的一般步骤包括下列哪项?( )',
        '["明确所设计的智能产品/系统所要达到的智能目标", "收集与该产品/系统设计相关的各类数据", "选择多个适当的AI算法以备使用", "监视AI模型的属性,并作必要的调整使其能持续符合预定的设计目标"]',
        '["A", "B", "C", "D"]', 'ABCD', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-655843-314', 'bank-1769162230466', 'MULTIPLE',
        '产品设计部的主要职责包括:( )',
        '["输出产品方案", "帮助客户解决业务问题", "进行需求挖掘、需求分析、需求管理", "获取流量及销售线索", "负责产品售后跟踪与转化"]',
        '["A", "C"]', 'AC', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-15054-315', 'bank-1769162230466', 'MULTIPLE',
        '业务流程优化的主要方法包括:( )',
        '["智能系统改造法", "全新设计法", "传统改进法", "自动化改造法", "局部调整法"]',
        '["A", "B"]', 'AB', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-715228-316', 'bank-1769162230466', 'MULTIPLE',
        '人工智能算法测试的基本流程包括哪些步骤?( )',
        '["明确算法测试需求", "编写算法测试方案", "编写测试数据方案", "执行算法测试", "确定测试环境搭建人员"]',
        '["A", "B", "C", "D"]', 'ABCD', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-505631-317', 'bank-1769162230466', 'MULTIPLE',
        '在人工智能算法测试中,评价指标包括哪些?( )',
        '["混淆矩阵", "准确率", "精确率", "召回率", "F1-score值"]',
        '["A", "B", "C", "D", "E"]', 'ABCDE', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-782057-318', 'bank-1769162230466', 'MULTIPLE',
        '在汽车文章标题自动分类模型测试中,数据准备阶段需要收集哪些专栏的标题名称?( )',
        '["新车测评", "买车中心", "自驾游记", "汽车改装", "汽车保养"]',
        '["A", "B", "C", "D"]', 'ABCD', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-35309-319', 'bank-1769162230466', 'MULTIPLE',
        '智能客服机器人的工作原理包括哪些部分?( )',
        '["知识库构建", "语义理解", "问答匹配", "用户反馈", "用户画像分析"]',
        '["A", "B", "C"]', 'ABC', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-627116-320', 'bank-1769162230466', 'MULTIPLE',
        '完整的邀约机器人系统中,语音识别模块可能包括下列哪些?( )',
        '["N-gram", "RNN", "ASRT", "LSTM", "CNN"]',
        '["A", "B", "C", "D"]', 'ABCD', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. JUDGE (TRUE/FALSE) QUESTIONS (10)
-- ============================================================================
INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-77705-304', 'bank-1769162230466', 'JUDGE',
        '职业道德通常来说没有实质性的约束力和强制力,主要依靠个人的自觉性',
        '["正确", "错误"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-519597-305', 'bank-1769162230466', 'JUDGE',
        '计算从业者应该考虑为社会和人类的幸福做出贡献,承认所有人都是计算的利益相关者',
        '["正确", "错误"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-850807-306', 'bank-1769162230466', 'JUDGE',
        '任何公民享有宪法和法律规定的权利,同时必须履行宪法和法律规定的义务',
        '["正确", "错误"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-196474-307', 'bank-1769162230466', 'JUDGE',
        '爱岗敬业指的是忠于职守的事业精神,这是职业道德的基础',
        '["正确", "错误"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-607428-308', 'bank-1769162230466', 'JUDGE',
        '( )聚类模型评估指标包括混淆矩阵。',
        '["正确", "错误"]',
        '"B"', 'B', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-648388-309', 'bank-1769162230466', 'JUDGE',
        '( )文本类业务数据的采集不需要考虑合法性。',
        '["正确", "错误"]',
        '"B"', 'B', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-143789-310', 'bank-1769162230466', 'JUDGE',
        '( )点云类业务数据是三维坐标系中的一组向量集合。',
        '["正确", "错误"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-855547-311', 'bank-1769162230466', 'JUDGE',
        '精神是对职业劳动的奉献精神',
        '["正确", "错误"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-682991-312', 'bank-1769162230466', 'JUDGE',
        '劳动者应当完成劳动任务,提高职业技能,执行劳动安全卫生规程,遵守劳动纪律和职业道德',
        '["正确", "错误"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, explanation, sort_order, created_at, updated_at)
VALUES ('q-imp-1769162244115-924255-313', 'bank-1769162230466', 'JUDGE',
        '( )回归模型评估指标包括平均绝对误差、中值绝对误差、决定系数。',
        '["正确", "错误"]',
        '"A"', 'A', 0, now(), now()) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. SHORT_ANSWER QUESTIONS (10)
-- ============================================================================
INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-1', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读下列材料，回答问题。材料：清朝在四川建立统治地位后，实行了休养生息的政策，耕地面积迅速扩大，粮食大幅度增产，商品经济逐渐活跃。重庆地处川江枢纽，川江主要支流嘉陵江、沱江、岷江流域都是粮、棉、糖、盐产区，汇流而下，集中重庆再转运汉口。到乾隆初年，重庆已是"商贾云集，百物萃聚"。（1）根据材料，概括清代重庆城市发展的有利因素。（2分）（2）结合所学知识，分析重庆开埠带来的影响。（2分）',
        '[]',
        '"（1）①四川经济的恢复和发展；②重庆地处川江枢纽，交通位置重要。（2分）\n（2）影响：①列强侵略势力进入长江上游，半殖民地化程度加深；②被卷入资本主义世界市场，加速了自然经济解体进程。（2分）"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-2', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读材料，回答问题。材料：抗战时期，大批沿海工业内迁重庆。重庆地处中国内陆腹地，三面环山，长年多雾，使敌机模糊攻击目标。1940年9月6日，国民政府正式定重庆为中华民国陪都。（1）指出重庆在抗战时期的地位。（2分）（2）概括重庆经济得以快速发展的重要原因。（4分）',
        '[]',
        '"（1）地位：陪都（战时首都）（2分）\n（2）原因：①沿海工业大量内迁，奠定了发展的基础；②有利的自然环境，为战时经济发展提供相对安全的保障；③城市地位的上升导致东部人才和技术迁入；④国民政府战时经济政策的一定作用。（任答4点）"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-3', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读材料，回答问题。材料：实践告诉我们，中国共产党为什么能，中国特色社会主义为什么好，归根到底是马克思主义行，是中国化、时代化的马克思主义行。——摘编自《中共二十大报告》请围绕"中国共产党为什么能"为主题，结合所学自拟一个你想论述的观点，运用中国共产党在新民主主义革命时期实践中的两个史实加以阐述或说明。(要求:观点正确，史论结合，条理清楚)',
        '[]',
        '"【示例】坚持统一战线，是中国共产党取得革命胜利的法宝。论述：1924年，中国共产党与国民党合作建立革命统一战线，开展国民革命，基本推翻北洋军阀的统治。1931年九一八事变后，中国共产党积极推动国共实现第二次合作，建立抗日民族统一战线，通过全民族浴血奋战，取得近代以来反抗外敌入侵的第一次完全胜利。结论：团结就是力量，坚持统一战线，是中国共产党取得革命胜利的法宝。"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-4', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读材料，回答问题。近代以来，为了彻底摆脱历史厄运、赢得革命胜利、大踏步赶上时代潮流，中国无数仁人志士进行过前赴后继的奋斗与探索，他们的奋斗足迹遍布祖国山河。请围绕"近代以来中国各阶级救亡图存的探索"为主题，结合所学自拟一个观点并加以论述。',
        '[]',
        '"示例：19世纪60年代到90年代中期，清政府部分开明官员主张利用西方先进技术，掀起洋务运动，客观上促进了中国民族资本主义的产生。1919年，巴黎和会外交失败引发五四运动，学生为先锋，工人阶级为主力，将反帝反封建的爱国革命运动推向全国。这是中国人民反帝斗争的一次重大胜利。总而言之，面对民族危机的不断加剧，中国各阶级为救亡图存，尝试了不同的救国方案。"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-5', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读材料，回答问题。材料：陶行知1939年在重庆创办了育才学校，以"培养人才之幼苗，使得其天赋才能得以发展"为宗旨，根据学生的兴趣和特长，设立了社会科学、自然科学、文学、艺术等组，注重培养学生的实践能力和创新精神。（1）分析陶行知创办育才学校的目的。（3分）（2）谈谈你对儿童教育的认识。（2分）',
        '[]',
        '"（1）目的：①挖掘学生天赋；②培养学生实践能力和创新精神；③为国家培养人才。（每点1分）\n（2）认识：儿童教育至关重要，应注重儿童全面发展；教育要结合时代需求注重公平。（2分）"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-6', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读材料，回答问题。材料：新中国成立以来，党和政府高度重视儿童教育和关怀。实行九年义务教育制度，保障每个儿童都有接受教育的权利。不断加大教育投入，改善办学条件，提高教育质量。实施了农村义务教育学生营养改善计划、进城务工人员随迁子女接受义务教育等政策。（1）概括新中国成立以来国家对儿童的关怀采取了哪些措施？（3分）（2）说明其意义。（3分）',
        '[]',
        '"（1）措施：①完善教育制度和政策；②加大教育投入；③开展关爱儿童活动。（每点1分）\n（2）意义：①保障了儿童的受教育权；②促进了教育公平；③有利于儿童健康成长。（每点1分）"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-7', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读材料，回答问题。材料：人民群众在历史的发展过程中起到了重要作用。（1）指出文艺复兴运动和新文化运动的共同点及其核心思想。（2）概括英法两国资产阶级革命文献的共同诉求。（3）简析抗美援朝运动时期人民生产和捐献的特点。（4）谈谈你对"人民群众是历史创造者"的认识。',
        '[]',
        '"（1）共同点：都是思想解放运动；核心思想：文艺复兴以人为中心/人文主义，新文化运动提倡民主与科学。\n（2）共同诉求：要求平等权利/废除特权/限制国王政治权利；改革税收制度/促进商业发展。（两个维度，两点2分）\n（3）特点：（生产和捐献）积极性强；群体性广；贡献力量大。\n（4）人民的力量强大；人民群众是历史的主体；人民群众是历史的创造者。"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-8', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读材料，回答问题。请围绕"思想解放是社会进步的重要推动力"为观点，结合文艺复兴运动和新文化运动的相关史实加以论述。',
        '[]',
        '"论述：14世纪，西欧资产阶级掀起的文艺复兴运动，反对教会\"神权至上\"，提倡人文主义，推动了欧洲文化思想领域的繁荣，为欧洲资本主义的产生和发展奠定了思想文化基础。1915年的新文化运动，提倡民主和科学，动摇了封建礼教的统治地位，宣传马克思主义，为中国共产党的成立奠定了思想基础，促进了中国社会的进步。综上所述，思想解放是社会进步的重要推动力，先进思想指导社会实践，是社会发展的先导。"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-9', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读材料，回答问题。请围绕"适宜的改革是社会进步的重要动力"为观点，结合俄国农奴制改革和日本明治维新的相关史实加以论述。',
        '[]',
        '"观点：适宜的改革是社会进步的重要动力（2分）。论述：19世纪中后期，农奴制严重阻碍了俄国资本主义发展，沙皇亚历山大二世颁布法令，解放农奴人身自由，推动了俄国资本主义的发展。明治政府以\"文明开化\"为纲领，结合国情学习西方，使日本走上了资本主义道路。总结：俄国农奴制改革与日本明治维新，以\"适宜性\"为钥解锁了社会进步的闸门，因此适宜的改革有利于社会的进步。"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, answer, sort_order, created_at, updated_at)
VALUES ('seed-short-10', 'bank-1770715976353', 'SHORT_ANSWER',
        '阅读材料，回答问题。材料：古代印度婆罗门教时期，教育成为阶级身份和等级地位的标识。婆罗门种姓的子女幼年开始学习《吠陀》。刹帝利、吠舍种姓的子弟学习实际有用的知识。首陀罗种姓的子女被完全剥夺了受教育的权利。（1）分别概括古代印度教育的内容和特点。（4分）',
        '[]',
        '"（1）内容：①宗教信条（《吠陀》）；②实用知识。（2分）特点：①教育内容与宗教联系紧密；②具有阶级性和不平等性；③由长辈教导。（任答2点4分）"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. FILL_IN_BLANK QUESTIONS (10)
-- ============================================================================
INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-1', 'bank-1769162230466', 'FILL_IN_BLANK',
        '人工智能的英文全称是（ ），中文简称为"人工智能"。',
        '[]',
        '["Artificial Intelligence"]',
        '"Artificial Intelligence"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-2', 'bank-1769162230466', 'FILL_IN_BLANK',
        '机器学习中，监督学习使用（ ）数据进行训练，无监督学习使用（ ）数据进行训练。',
        '[]',
        '["有标签", "无标签"]',
        '"有标签,无标签"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-3', 'bank-1769162230466', 'FILL_IN_BLANK',
        '深度学习中使用（ ）函数作为激活函数可以缓解梯度消失问题。',
        '[]',
        '["ReLU"]',
        '"ReLU"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-4', 'bank-1769162230466', 'FILL_IN_BLANK',
        '混淆矩阵中的四个基本指标分别是TP（真正例）、FP（ ）、TN（ ）、FN（假反例）。',
        '[]',
        '["假正例", "真反例"]',
        '"假正例,真反例"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-5', 'bank-1769162230466', 'FILL_IN_BLANK',
        '数据预处理中，常用的标准化方法有（ ）标准化和最小-最大标准化。',
        '[]',
        '["Z-score"]',
        '"Z-score"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-6', 'bank-1769162230466', 'FILL_IN_BLANK',
        '卷积神经网络（CNN）的核心组件包括卷积层、（ ）层和全连接层。',
        '[]',
        '["池化"]',
        '"池化"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-7', 'bank-1769162230466', 'FILL_IN_BLANK',
        '自然语言处理中，（ ）技术可以将文本转换为向量表示，如Word2Vec和BERT。',
        '[]',
        '["词嵌入"]',
        '"词嵌入"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-8', 'bank-1769162230466', 'FILL_IN_BLANK',
        '过拟合是指模型在训练集上表现（ ），但在测试集上表现（ ）。',
        '[]',
        '["很好", "较差"]',
        '"很好,较差"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-9', 'bank-1769162230466', 'FILL_IN_BLANK',
        'AI训练流程一般包括数据采集、数据标注、（ ）、模型评估和模型部署五个阶段。',
        '[]',
        '["模型训练"]',
        '"模型训练"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, bank_id, type, content, options, blanks, answer, sort_order, created_at, updated_at)
VALUES ('seed-fill-10', 'bank-1769162230466', 'FILL_IN_BLANK',
        'TensorFlow和（ ）是目前最流行的两个深度学习框架。',
        '[]',
        '["PyTorch"]',
        '"PyTorch"',
        0, now(), now()) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. DEFAULT ADMIN USER
--    Phone: admin  |  Password: admin  |  Role: ADMIN
-- ============================================================================
INSERT INTO users (id, phone, password, role, real_name, nickname, created_at, updated_at)
VALUES ('admin-seed-001', 'admin',
        '$2b$10$seUnaJh8lBF1NQs6Yd4Sau/awE3zEw2hjXZWR7bV4pZ0k3vXSNsky',
        'ADMIN', '系统管理员', 'Admin',
        now(), now()) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. SAMPLE VOD COURSE + CHAPTERS + LESSONS
-- ============================================================================
INSERT INTO courses (id, title, description, cover_url, course_type, category, teacher_name,
                     teacher_intro, price, status, sort_order, student_count, created_at, updated_at)
VALUES ('course-vod-001',
        'Python 编程入门',
        '从零开始学习 Python 编程语言，掌握基本语法、数据结构和常用库的使用，适合编程初学者。',
        'https://example.com/covers/python-intro.jpg',
        'vod',
        '编程开发',
        '张老师',
        '10年Python开发经验，曾任职多家互联网公司，擅长深入浅出的教学方法。',
        99.00,
        'published',
        1,
        256,
        now(),
        now());

INSERT INTO course_chapters (id, course_id, title, description, sort_order, created_at)
VALUES ('chapter-vod-001', 'course-vod-001', '第一章 Python 基础', '介绍 Python 的安装、基本语法和数据类型', 1, now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO course_chapters (id, course_id, title, description, sort_order, created_at)
VALUES ('chapter-vod-002', 'course-vod-001', '第二章 Python 进阶', '函数、类和模块的深入讲解', 2, now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO course_chapters (id, course_id, title, description, sort_order, created_at)
VALUES ('chapter-vod-003', 'course-vod-001', '第三章 Python 实战项目', '通过实际项目巩固所学知识', 3, now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO course_lessons (id, chapter_id, course_id, title, video_type, video_url, duration, is_free_preview, sort_order, created_at)
VALUES ('lesson-vod-001', 'chapter-vod-001', 'course-vod-001',
        '1.1 Python 简介与环境搭建', 'upload',
        'https://example.com/videos/python-intro-setup.mp4',
        1200, true, 1, now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO course_lessons (id, chapter_id, course_id, title, video_type, video_url, duration, is_free_preview, sort_order, created_at)
VALUES ('lesson-vod-002', 'chapter-vod-001', 'course-vod-001',
        '1.2 变量与基本数据类型', 'upload',
        'https://example.com/videos/python-variables.mp4',
        900, false, 2, now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO course_lessons (id, chapter_id, course_id, title, video_type, video_url, duration, is_free_preview, sort_order, created_at)
VALUES ('lesson-vod-003', 'chapter-vod-001', 'course-vod-001',
        '1.3 字符串与列表操作', 'upload',
        'https://example.com/videos/python-strings-lists.mp4',
        1500, false, 3, now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO course_lessons (id, chapter_id, course_id, title, video_type, video_url, duration, is_free_preview, sort_order, created_at)
VALUES ('lesson-vod-004', 'chapter-vod-002', 'course-vod-001',
        '2.1 条件判断与循环结构', 'upload',
        'https://example.com/videos/python-control-flow.mp4',
        1100, false, 1, now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO course_lessons (id, chapter_id, course_id, title, video_type, video_url, duration, is_free_preview, sort_order, created_at)
VALUES ('lesson-vod-005', 'chapter-vod-002', 'course-vod-001',
        '2.2 函数的定义与使用', 'upload',
        'https://example.com/videos/python-functions.mp4',
        1300, false, 2, now()) ON CONFLICT (id) DO NOTHING;

INSERT INTO course_lessons (id, chapter_id, course_id, title, video_type, video_url, duration, is_free_preview, sort_order, created_at)
VALUES ('lesson-vod-006', 'chapter-vod-003', 'course-vod-001',
        '3.1 实战项目：数据分析入门', 'upload',
        'https://example.com/videos/python-data-analysis.mp4',
        1800, false, 1, now()) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. SAMPLE LIVE COURSE + LIVE SESSION
-- ============================================================================
INSERT INTO courses (id, title, description, cover_url, course_type, category, teacher_name,
                     teacher_intro, price, status, sort_order, student_count, created_at, updated_at)
VALUES ('course-live-001',
        '人工智能应用实战直播课',
        '每周直播授课，讲解 AI 模型训练、部署与优化。配合实战项目，与讲师实时互动答疑。',
        'https://example.com/covers/ai-live.jpg',
        'live',
        '人工智能',
        '李教授',
        '知名 AI 研究专家，博士生导师，发表多篇顶会论文，具有丰富的工业界项目经验。',
        299.00,
        'published',
        2,
        128,
        now(),
        now());

INSERT INTO live_sessions (id, course_id, title, meeting_number, meeting_url, meeting_password,
                           start_time, end_time, status, created_at)
VALUES ('session-live-001',
        'course-live-001',
        '第一讲：AI 模型训练实战',
        '10001',
        'https://meeting.example.com/ai-training-001',
        '123456',
        now() + interval '2 days',
        now() + interval '2 days' + interval '2 hours',
        'scheduled',
        now());

INSERT INTO live_sessions (id, course_id, title, meeting_number, meeting_url, meeting_password,
                           start_time, end_time, status, replay_url, created_at)
VALUES ('session-live-002',
        'course-live-001',
        '第二讲：模型部署与优化',
        '10002',
        'https://meeting.example.com/ai-training-002',
        '123456',
        now() - interval '5 days',
        now() - interval '5 days' + interval '2 hours',
        'ended',
        'https://meeting.example.com/replay/ai-training-002.mp4',
        now());

-- ============================================================================
-- 10. RESET BANK QUESTION COUNTS
-- ============================================================================
UPDATE banks
SET question_count = (
    SELECT count(*)
    FROM questions
    WHERE questions.bank_id = banks.id
);

COMMIT;
