import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./edumaster.db');

// 查找"人工智能训练师三级"题库
db.get("SELECT * FROM banks WHERE name LIKE '%人工智能训练师三级%'", (err, bank) => {
  if (err) {
    console.error('查询题库失败:', err);
    process.exit(1);
  }
  
  if (!bank) {
    console.error('未找到"人工智能训练师三级"题库');
    process.exit(1);
  }
  
  console.log('找到题库:', bank.name, '(ID:', bank.id + ')');
  
  // 准备30道测试题目
  const questions = [
    // 单选题 (10题)
    {
      type: 'SINGLE',
      content: '人工智能的英文缩写是什么？',
      options: ['AI', 'IA', 'ML', 'DL'],
      answer: 'A',
      explanation: 'AI是Artificial Intelligence的缩写，即人工智能。'
    },
    {
      type: 'SINGLE',
      content: '以下哪个不是机器学习的主要类型？',
      options: ['监督学习', '无监督学习', '强化学习', '逻辑学习'],
      answer: 'D',
      explanation: '机器学习主要包括监督学习、无监督学习和强化学习三大类型。'
    },
    {
      type: 'SINGLE',
      content: '神经网络中的"神经元"是指什么？',
      options: ['生物神经元', '计算单元', '数据节点', '网络层'],
      answer: 'B',
      explanation: '神经网络中的神经元是指基本的计算单元，模拟生物神经元的功能。'
    },
    {
      type: 'SINGLE',
      content: '深度学习中的"深度"主要指的是什么？',
      options: ['数据量大', '网络层数多', '训练时间长', '模型复杂'],
      answer: 'B',
      explanation: '深度学习中的"深度"主要指神经网络的层数较多。'
    },
    {
      type: 'SINGLE',
      content: '以下哪个是常用的深度学习框架？',
      options: ['MySQL', 'TensorFlow', 'MongoDB', 'Redis'],
      answer: 'B',
      explanation: 'TensorFlow是Google开发的开源深度学习框架。'
    },
    {
      type: 'SINGLE',
      content: '在机器学习中，过拟合是指什么？',
      options: ['模型太简单', '模型在训练集上表现好但在测试集上表现差', '训练时间太长', '数据量太少'],
      answer: 'B',
      explanation: '过拟合是指模型过度学习训练数据的特征，导致泛化能力差。'
    },
    {
      type: 'SINGLE',
      content: '卷积神经网络(CNN)主要用于处理什么类型的数据？',
      options: ['文本数据', '图像数据', '音频数据', '表格数据'],
      answer: 'B',
      explanation: 'CNN通过卷积操作提取图像特征，主要用于图像识别和处理。'
    },
    {
      type: 'SINGLE',
      content: '自然语言处理(NLP)的主要任务不包括以下哪项？',
      options: ['文本分类', '机器翻译', '图像识别', '情感分析'],
      answer: 'C',
      explanation: '图像识别属于计算机视觉领域，不是NLP的任务。'
    },
    {
      type: 'SINGLE',
      content: '以下哪个不是激活函数？',
      options: ['ReLU', 'Sigmoid', 'Tanh', 'Adam'],
      answer: 'D',
      explanation: 'Adam是优化算法，不是激活函数。常见激活函数有ReLU、Sigmoid、Tanh等。'
    },
    {
      type: 'SINGLE',
      content: '在训练神经网络时，学习率的作用是什么？',
      options: ['控制训练速度', '控制模型大小', '控制数据量', '控制层数'],
      answer: 'A',
      explanation: '学习率控制参数更新的步长，影响模型收敛速度和效果。'
    },
    
    // 多选题 (10题)
    {
      type: 'MULTIPLE',
      content: '以下哪些属于人工智能的应用领域？',
      options: ['语音识别', '图像识别', '自动驾驶', '天气预报'],
      answer: ['A', 'B', 'C', 'D'],
      explanation: '这些都是人工智能的重要应用领域，包括语音识别、图像识别、自动驾驶和天气预报。'
    },
    {
      type: 'MULTIPLE',
      content: '机器学习的评估指标包括哪些？',
      options: ['准确率', '召回率', 'F1分数', 'ROC曲线'],
      answer: ['A', 'B', 'C', 'D'],
      explanation: '这些都是常用的机器学习模型评估指标。'
    },
    {
      type: 'MULTIPLE',
      content: '深度学习训练过程中可能遇到的问题有哪些？',
      options: ['梯度消失', '过拟合', '欠拟合', '梯度爆炸'],
      answer: ['A', 'B', 'C', 'D'],
      explanation: '这些都是深度学习训练中常见的问题。'
    },
    {
      type: 'MULTIPLE',
      content: '以下哪些是常用的优化算法？',
      options: ['SGD', 'Adam', 'RMSprop', 'AdaGrad'],
      answer: ['A', 'B', 'C', 'D'],
      explanation: '这些都是深度学习中常用的优化算法。'
    },
    {
      type: 'MULTIPLE',
      content: '数据预处理的常见方法包括哪些？',
      options: ['归一化', '标准化', '缺失值处理', '特征选择'],
      answer: ['A', 'B', 'C', 'D'],
      explanation: '这些都是数据预处理的重要步骤。'
    },
    {
      type: 'MULTIPLE',
      content: '以下哪些是循环神经网络(RNN)的变体？',
      options: ['LSTM', 'GRU', 'CNN', 'Transformer'],
      answer: ['A', 'B'],
      explanation: 'LSTM和GRU是RNN的改进版本，CNN是卷积神经网络，Transformer是注意力机制模型。'
    },
    {
      type: 'MULTIPLE',
      content: '训练集、验证集和测试集的作用分别是什么？',
      options: ['训练模型', '调整超参数', '评估模型性能', '以上都对'],
      answer: ['A', 'B', 'C'],
      explanation: '训练集用于训练模型，验证集用于调整超参数，测试集用于最终评估。'
    },
    {
      type: 'MULTIPLE',
      content: '以下哪些技术可以防止过拟合？',
      options: ['Dropout', '正则化', '数据增强', '早停法'],
      answer: ['A', 'B', 'C', 'D'],
      explanation: '这些都是有效的防止过拟合的技术。'
    },
    {
      type: 'MULTIPLE',
      content: '计算机视觉的主要任务包括哪些？',
      options: ['图像分类', '目标检测', '图像分割', '人脸识别'],
      answer: ['A', 'B', 'C', 'D'],
      explanation: '这些都是计算机视觉领域的重要任务。'
    },
    {
      type: 'MULTIPLE',
      content: '以下哪些是生成式AI模型？',
      options: ['GAN', 'VAE', 'GPT', 'BERT'],
      answer: ['A', 'B', 'C'],
      explanation: 'GAN、VAE和GPT都是生成式模型，BERT是判别式模型。'
    },
    
    // 判断题 (10题)
    {
      type: 'JUDGE',
      content: '人工智能就是让机器像人一样思考和行动。',
      options: ['正确', '错误'],
      answer: 'A',
      explanation: '这是人工智能的基本定义，让机器模拟人类的智能行为。'
    },
    {
      type: 'JUDGE',
      content: '深度学习是机器学习的一个子集。',
      options: ['正确', '错误'],
      answer: 'A',
      explanation: '深度学习是机器学习的一个分支，使用深层神经网络。'
    },
    {
      type: 'JUDGE',
      content: '神经网络只能有一个隐藏层。',
      options: ['正确', '错误'],
      answer: 'B',
      explanation: '神经网络可以有多个隐藏层，深度学习通常使用多层网络。'
    },
    {
      type: 'JUDGE',
      content: '训练数据越多，模型效果一定越好。',
      options: ['正确', '错误'],
      answer: 'B',
      explanation: '数据质量比数量更重要，低质量的数据反而会降低模型性能。'
    },
    {
      type: 'JUDGE',
      content: '迁移学习可以利用预训练模型来加速新任务的训练。',
      options: ['正确', '错误'],
      answer: 'A',
      explanation: '迁移学习通过复用预训练模型的知识，可以显著提高训练效率。'
    },
    {
      type: 'JUDGE',
      content: '批量归一化(Batch Normalization)可以加速训练过程。',
      options: ['正确', '错误'],
      answer: 'A',
      explanation: '批量归一化可以稳定训练过程，加快收敛速度。'
    },
    {
      type: 'JUDGE',
      content: '所有的机器学习问题都需要使用深度学习来解决。',
      options: ['正确', '错误'],
      answer: 'B',
      explanation: '简单问题使用传统机器学习方法可能更有效，深度学习适合复杂问题。'
    },
    {
      type: 'JUDGE',
      content: '注意力机制(Attention)是Transformer模型的核心。',
      options: ['正确', '错误'],
      answer: 'A',
      explanation: 'Transformer完全基于注意力机制，不使用循环结构。'
    },
    {
      type: 'JUDGE',
      content: '强化学习需要大量的标注数据。',
      options: ['正确', '错误'],
      answer: 'B',
      explanation: '强化学习通过与环境交互获得奖励信号，不需要标注数据。'
    },
    {
      type: 'JUDGE',
      content: '特征工程在深度学习中仍然很重要。',
      options: ['正确', '错误'],
      answer: 'B',
      explanation: '深度学习可以自动学习特征，减少了人工特征工程的需求。'
    }
  ];
  
  console.log(`准备添加 ${questions.length} 道题目到题库 ${bank.name}`);
  
  // 插入题目
  let inserted = 0;
  const stmt = db.prepare(
    "INSERT INTO questions (id, bankId, type, content, options, answer, explanation) VALUES (?,?,?,?,?,?,?)"
  );
  
  questions.forEach((q, index) => {
    const id = `q-ai3-${Date.now()}-${index}`;
    stmt.run(
      id,
      bank.id,
      q.type,
      q.content,
      JSON.stringify(q.options),
      JSON.stringify(q.answer),
      q.explanation,
      (err) => {
        if (err) {
          console.error(`插入题目 ${index + 1} 失败:`, err);
        } else {
          inserted++;
          console.log(`✓ 已添加题目 ${index + 1}/${questions.length}: ${q.content.substring(0, 30)}...`);
        }
      }
    );
  });
  
  stmt.finalize((err) => {
    if (err) {
      console.error('完成插入时出错:', err);
    } else {
      // 更新题库的题目数量
      db.run(
        "UPDATE banks SET questionCount = questionCount + ? WHERE id = ?",
        [inserted, bank.id],
        (err) => {
          if (err) {
            console.error('更新题库数量失败:', err);
          } else {
            console.log(`\n✅ 成功添加 ${inserted} 道题目到题库 ${bank.name}`);
            console.log(`题库ID: ${bank.id}`);
            console.log(`题目类型: 单选10题、多选10题、判断10题`);
          }
          db.close();
        }
      );
    }
  });
});
