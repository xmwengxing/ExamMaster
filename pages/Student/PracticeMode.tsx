
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Question, QuestionType, PracticeMode, QuestionBank, PracticeRecord } from '../../types';
import { useAppStore } from '../../store';
import { getEffectiveApiKey, hasApiKey, getApiKeyMissingMessage, generateQuestionAnalysis } from '../../utils/deepseek';

interface PracticeModeProps {
  mode: PracticeMode;
  questions: Question[];
  onFinish: (result?: any) => void;
  onCorrect: (q: Question) => void;
  onWrong: (q: Question) => void;
  onToggleFavorite: (q: Question) => void;
  favorites: Question[];
  bank?: QuestionBank;
  exam?: any;
  initialIndex?: number;
  initialAnswers?: Record<string, string[]>;
}

const PracticeModeView: React.FC<PracticeModeProps> = ({ 
  mode, questions, onFinish, onCorrect, onWrong, onToggleFavorite, favorites, bank, exam, initialIndex = 0, initialAnswers = {} 
}) => {
  const store = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>(initialAnswers);
  const prevInitialIndexRef = useRef(initialIndex);
  const prevInitialAnswersRef = useRef(JSON.stringify(initialAnswers));
  
  // 调试：监控systemConfig的变化
  useEffect(() => {
    console.log('[PracticeMode] systemConfig更新:', {
      hasConfig: !!store.systemConfig,
      hasDeepseekKey: !!store.systemConfig?.deepseekApiKey,
      keyLength: store.systemConfig?.deepseekApiKey?.length || 0
    });
  }, [store.systemConfig]);
  
  // 使用 ref 追踪最新的进度状态，用于退出时保存
  const currentProgressRef = useRef({ currentIndex: initialIndex, userAnswers: initialAnswers });

  // 当 initialIndex 或 initialAnswers 变化时（例如从继续练习进入），更新状态
  useEffect(() => {
    if (prevInitialIndexRef.current !== initialIndex) {
      setCurrentIndex(initialIndex);
      currentProgressRef.current.currentIndex = initialIndex;
      prevInitialIndexRef.current = initialIndex;
    }
    const currentAnswersStr = JSON.stringify(initialAnswers);
    if (prevInitialAnswersRef.current !== currentAnswersStr) {
      setUserAnswers(initialAnswers || {});
      currentProgressRef.current.userAnswers = initialAnswers || {};
      prevInitialAnswersRef.current = currentAnswersStr;
    }
  }, [initialIndex, initialAnswers]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(mode === PracticeMode.MEMORY);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [examStartTime] = useState(Date.now());
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  
  // 答题反馈动画状态
  const [feedbackClass, setFeedbackClass] = useState('');
  
  // 个人笔记相关状态
  const [personalNote, setPersonalNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // SRS 状态
  const [isSrsMasteryUpdated, setIsSrsMasteryUpdated] = useState(false);

  // 触摸滑动相关状态
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0); // 滑动偏移量
  const [isTransitioning, setIsTransitioning] = useState(false); // 是否在过渡动画中

  // 填空题状态
  const [fillBlankAnswers, setFillBlankAnswers] = useState<Record<string, string>>({});
  const [fillBlankResult, setFillBlankResult] = useState<any>(null);
  const [isGradingFillBlank, setIsGradingFillBlank] = useState(false);

  // 简答题状态
  const [shortAnswer, setShortAnswer] = useState('');
  const [shortAnswerResult, setShortAnswerResult] = useState<any>(null);
  const [isGradingShortAnswer, setIsGradingShortAnswer] = useState(false);

  const noteContentRef = useRef('');
  const activeQuestionIdRef = useRef<string | null>(null);
  const arrowTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionProgressRecorded = useRef<Set<string>>(new Set());

  const currentQuestion = questions[currentIndex];
  const isMockMode = mode === PracticeMode.MOCK;
  const isMemoryMode = mode === PracticeMode.MEMORY;
  const isMistakeMode = mode === PracticeMode.MISTAKE;
  const isSmartReviewMode = mode === PracticeMode.SMART_REVIEW;
  const isSequentialMode = mode === PracticeMode.SEQUENTIAL;
  const isFavorite = favorites.some(f => f.id === currentQuestion?.id);
  const isCustomSession = useMemo(() => !!exam?.isCustom, [exam]);

  useEffect(() => {
    noteContentRef.current = personalNote;
  }, [personalNote]);

  useEffect(() => {
    const currentId = currentQuestion?.id;
    if (activeQuestionIdRef.current && activeQuestionIdRef.current !== currentId) {
      store.addNote(activeQuestionIdRef.current, noteContentRef.current);
    }
    activeQuestionIdRef.current = currentId;
    return () => {
      if (activeQuestionIdRef.current) {
        store.addNote(activeQuestionIdRef.current, noteContentRef.current);
      }
    };
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (mode === PracticeMode.SEQUENTIAL || mode === PracticeMode.MEMORY) {
      const targetName = bank?.name || exam?.bankName || '未知题库';
      const modeLabel = isCustomSession ? '自定义练习' : (mode === PracticeMode.MEMORY ? '背题模式' : '顺序练习');
      store.logAction('开始练习', `${targetName} (${modeLabel})`);
    } else if (mode === PracticeMode.SMART_REVIEW) {
      store.logAction('开始智能复习', `任务量: ${questions.length} 题`);
    }
  }, []);

  useEffect(() => {
    if (currentQuestion) {
      store.getNote(currentQuestion.id).then(note => {
        const content = note?.content || '';
        setPersonalNote(content);
        noteContentRef.current = content;
        setLastSaved(null);
      });
      setIsSrsMasteryUpdated(false);
      setFeedbackClass(''); // 切换题目重置动画类
      
      // 重置填空题状态
      setFillBlankAnswers({});
      setFillBlankResult(null);
      setIsGradingFillBlank(false);
      
      // 重置简答题状态
      setShortAnswer('');
      setShortAnswerResult(null);
      setIsGradingShortAnswer(false);
    }
  }, [currentIndex, currentQuestion?.id]);

  const handleSaveNote = async () => {
    if (!currentQuestion) return;
    setIsSavingNote(true);
    await store.addNote(currentQuestion.id, personalNote);
    setIsSavingNote(false);
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => setLastSaved(null), 3000);
  };

  const groupedNavItems = useMemo(() => {
    const groups: Record<string, { label: string, items: { id: string, index: number }[] }> = {
      [QuestionType.SINGLE]: { label: '单选题', items: [] },
      [QuestionType.MULTIPLE]: { label: '多选题', items: [] },
      [QuestionType.JUDGE]: { label: '判断题', items: [] },
    };
    questions.forEach((q, idx) => {
      if (groups[q.type]) groups[q.type].items.push({ id: q.id, index: idx });
    });
    return Object.values(groups).filter(g => g.items.length > 0);
  }, [questions]);

  // 同步更新 ref，确保始终有最新值
  useEffect(() => {
    currentProgressRef.current = { currentIndex, userAnswers };
  }, [currentIndex, userAnswers]);

  useEffect(() => {
    if (isMockMode || isSmartReviewMode || !bank || questions.length === 0) return;
    
    const saveProgress = async () => {
      let recordId = exam?.id;
      if (isCustomSession && recordId) {
        // 自定义练习：更新现有记录
        await store.updatePracticeRecord(recordId, { currentIndex, userAnswers, date: new Date().toLocaleString() });
      } else {
        // 标准练习：查找或创建记录
        const record = await store.getPracticeRecord(bank.id, mode, false);
        if (record) {
          // 更新现有记录 - 关键：每次都保存 currentIndex，确保进度被记录
          await store.updatePracticeRecord(record.id, { currentIndex, userAnswers });
        } else {
          // 创建新记录
          await store.addPracticeRecord({
            id: Date.now().toString(), 
            bankId: bank.id, 
            bankName: bank.name, 
            mode, 
            type: '标准练习',
            count: questions.length, 
            date: new Date().toLocaleString(), 
            currentIndex, 
            userAnswers, 
            isCustom: false
          });
        }
      }
    };
    
    // 立即保存进度（做到哪记到哪）
    // 注意：由于 updatePracticeRecord 使用了防抖，快速切换时可能会有延迟
    // 但 currentIndex 的变化会确保最终状态被保存
    saveProgress();
  }, [currentIndex, userAnswers, isMockMode, bank, mode, questions.length, isCustomSession, exam?.id, isSmartReviewMode]);

  // 立即保存进度的函数（不使用防抖）
  const saveProgressImmediately = async (index: number, answers: Record<string, string[]>) => {
    if (isMockMode || isSmartReviewMode || !bank || questions.length === 0) return;
    
    console.log('[保存进度] 开始保存:', { index, answersCount: Object.keys(answers).length, currentQuestionId: currentQuestion?.id });
    
    try {
      const token = localStorage.getItem('edu_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      let recordId = exam?.id;
      if (isCustomSession && recordId) {
        // 自定义练习：直接调用 API，不经过防抖
        const response = await fetch(`/api/practice/${recordId}`, { 
          method: 'PUT',
          headers,
          body: JSON.stringify({ currentIndex: index, userAnswers: answers, date: new Date().toLocaleString() })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(`保存失败: ${response.status} ${response.statusText}`);
        }
        console.log('[保存进度] 自定义练习保存成功, 响应:', result);
      } else {
        // 标准练习：查找或创建记录
        const record = await store.getPracticeRecord(bank.id, mode, false);
        console.log('[保存进度] 查询到的记录:', record);
        
        if (record) {
          // 直接调用 API，不经过防抖
          const url = `/api/practice/${record.id}`;
          const body = { currentIndex: index, userAnswers: answers };
          console.log('[保存进度] 准备更新:', { url, body });
          
          const response = await fetch(url, { 
            method: 'PUT',
            headers,
            body: JSON.stringify(body)
          });
          const result = await response.json();
          console.log('[保存进度] 更新响应:', result);
          
          if (!response.ok) {
            throw new Error(`保存失败: ${response.status} ${response.statusText}`);
          }
          
          if (result.changes === 0) {
            console.error('[保存进度] 警告: 没有记录被更新！可能的原因：记录不存在或userId不匹配');
            console.log('[保存进度] 尝试重新创建记录...');
            // 如果更新失败，尝试创建新记录
            await store.addPracticeRecord({
              id: Date.now().toString(), 
              bankId: bank.id, 
              bankName: bank.name, 
              mode, 
              type: '标准练习',
              count: questions.length, 
              date: new Date().toLocaleString(), 
              currentIndex: index, 
              userAnswers: answers, 
              isCustom: false
            });
            console.log('[保存进度] 重新创建记录成功');
          } else {
            console.log('[保存进度] 标准练习更新成功, recordId:', record.id, '影响行数:', result.changes);
          }
        } else {
          // 创建新记录
          console.log('[保存进度] 记录不存在，创建新记录');
          await store.addPracticeRecord({
            id: Date.now().toString(), 
            bankId: bank.id, 
            bankName: bank.name, 
            mode, 
            type: '标准练习',
            count: questions.length, 
            date: new Date().toLocaleString(), 
            currentIndex: index, 
            userAnswers: answers, 
            isCustom: false
          });
          console.log('[保存进度] 创建新记录成功');
        }
      }
    } catch (error) {
      console.error('[保存进度] 失败:', error);
    }
  };

  const handleExit = async () => {
    // 退出前强制保存当前进度（使用 ref 获取最新值）
    if (!isMockMode && !isSmartReviewMode && bank && questions.length > 0) {
      try {
        const latestProgress = currentProgressRef.current;
        let recordId = exam?.id;
        if (isCustomSession && recordId) {
          await store.updatePracticeRecord(recordId, { 
            currentIndex: latestProgress.currentIndex, 
            userAnswers: latestProgress.userAnswers, 
            date: new Date().toLocaleString() 
          });
        } else {
          const record = await store.getPracticeRecord(bank.id, mode, false);
          if (record) {
            await store.updatePracticeRecord(record.id, { 
              currentIndex: latestProgress.currentIndex, 
              userAnswers: latestProgress.userAnswers 
            });
          }
        }
      } catch (error) {
        console.error('保存进度失败:', error);
      }
    }
    
    if (isMockMode) {
      onFinish(calculateFinalScore(false));
    } else {
      // 如果是从错题本或智能复习模式退出，返回到错题本页面
      if (isMistakeMode || isSmartReviewMode) {
        onFinish({ returnToMistakes: true });
      } else {
        onFinish();
      }
    }
  };

  const handleNext = async () => {
    // 在背题模式下，如果用户没有答题就点下一题，也要标记为已查看
    if (isMemoryMode && currentQuestion && !userAnswers[currentQuestion.id]) {
      // 记录一个特殊标记表示已查看但未作答
      const newAnswers = { ...userAnswers, [currentQuestion.id]: ['__VIEWED__'] };
      setUserAnswers(newAnswers);
      currentProgressRef.current.userAnswers = newAnswers;
      // 注意：这里使用 setTimeout 确保状态更新后再切换题目
      setTimeout(async () => {
        const newIndex = currentIndex + 1;
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(newIndex);
          currentProgressRef.current.currentIndex = newIndex;
          // 保存进度
          await saveProgressImmediately(newIndex, newAnswers);
        } else {
          onFinish();
        }
      }, 50);
      return;
    }
    
    if (currentIndex < questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      currentProgressRef.current.currentIndex = newIndex;
      // 点击"下一题"时也保存进度
      await saveProgressImmediately(newIndex, userAnswers);
    } else {
      if (isMockMode) {
        if (confirm('确定要提交试卷吗？')) onFinish(calculateFinalScore(true));
      } else onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  // 统一反馈处理：震动 + 动画类
  const provideFeedback = (isCorrect: boolean) => {
    if (isCorrect) {
      setFeedbackClass('animate-success');
    } else {
      setFeedbackClass('animate-shake');
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]); // 短促的双震动
      }
    }
    // 动画播放完后建议保持类名以便视觉停留，或者在切题时自动清除
  };

  const handleOptionClick = async (label: string) => {
    if (isAnswered && !isMockMode && !isMemoryMode) return;
    const current = userAnswers[currentQuestion.id] || [];
    let next: string[];
    
    if (currentQuestion.type === QuestionType.MULTIPLE) {
      next = current.includes(label) ? current.filter(l => l !== label) : [...current, label];
      const newAnswers = { ...userAnswers, [currentQuestion.id]: next };
      setUserAnswers(newAnswers);
      currentProgressRef.current.userAnswers = newAnswers;
    } else {
      // 单选题和判断题：立即记录答案（无论对错）
      next = [label];
      const newAnswers = { ...userAnswers, [currentQuestion.id]: next };
      setUserAnswers(newAnswers);
      currentProgressRef.current.userAnswers = newAnswers;
      
      if (!isMockMode && !isMemoryMode) {
        if (!sessionProgressRecorded.current.has(currentQuestion.id) && !isAnswered) {
          store.incrementDailyProgress();
          sessionProgressRecorded.current.add(currentQuestion.id);
        }
        setIsAnswered(true);
        const correctStr = Array.isArray(currentQuestion.answer) ? currentQuestion.answer.join('') : currentQuestion.answer;
        const isCorrect = label === correctStr;
        
        console.log(`[答题] ${isCorrect ? '✓ 答对' : '✗ 答错'}, 题目ID: ${currentQuestion.id}, 当前index: ${currentIndex}`);
        
        // 无论答对答错都调用回调（用于统计）
        if (isCorrect) onCorrect(currentQuestion);
        else onWrong(currentQuestion);
        
        provideFeedback(isCorrect);
        setShowExplanation(true);
        
        // 关键：答题后立即保存进度
        await saveProgressImmediately(currentIndex, newAnswers);
      }
    }
  };

  const handleConfirmMultiple = async () => {
    if (!currentQuestion || confirmedIds.has(currentQuestion.id)) return;
    const answers = userAnswers[currentQuestion.id] || [];
    if (answers.length === 0) return alert('请至少选择一个选项');
    if (!isMockMode && !isMemoryMode && !sessionProgressRecorded.current.has(currentQuestion.id)) {
      store.incrementDailyProgress();
      sessionProgressRecorded.current.add(currentQuestion.id);
    }
    setConfirmedIds(prev => new Set(prev).add(currentQuestion.id));
    setIsAnswered(true);
    setShowExplanation(true);
    const uAnswerStr = [...answers].sort().join('');
    const correctStr = (Array.isArray(currentQuestion.answer) ? [...currentQuestion.answer].sort() : [currentQuestion.answer]).join('');
    const isCorrect = uAnswerStr === correctStr;
    if (isCorrect) onCorrect(currentQuestion);
    else onWrong(currentQuestion);
    provideFeedback(isCorrect);
    
    // 多选题确认后也要更新 ref 并立即保存
    currentProgressRef.current.userAnswers = userAnswers;
    await saveProgressImmediately(currentIndex, userAnswers);
  };

  // 填空题提交处理
  const handleSubmitFillBlank = async () => {
    if (!currentQuestion || currentQuestion.type !== QuestionType.FILL_IN_BLANK) return;
    
    // 检查是否所有空白都已填写
    const blanks = currentQuestion.blanks || [];
    const emptyBlanks = blanks.filter(blank => !fillBlankAnswers[blank.id] || fillBlankAnswers[blank.id].trim() === '');
    if (emptyBlanks.length > 0) {
      return alert('请填写所有空白');
    }
    
    setIsGradingFillBlank(true);
    
    try {
      // 调用评分API
      const result = await store.gradeFillInBlank(currentQuestion.id, fillBlankAnswers);
      
      setFillBlankResult(result);
      setIsAnswered(true);
      setShowExplanation(true);
      
      // 保存用户答案（转换为数组格式以兼容现有系统）
      const answerArray = blanks.map(blank => fillBlankAnswers[blank.id] || '');
      const newAnswers = {
        ...userAnswers,
        [currentQuestion.id]: answerArray
      };
      setUserAnswers(newAnswers);
      
      // 统计答对/答错
      if (result.isAllCorrect) {
        onCorrect(currentQuestion);
        provideFeedback(true);
      } else {
        onWrong(currentQuestion);
        provideFeedback(false);
      }
      
      // 记录每日进度
      if (!isMockMode && !isMemoryMode && !sessionProgressRecorded.current.has(currentQuestion.id)) {
        store.incrementDailyProgress();
        sessionProgressRecorded.current.add(currentQuestion.id);
      }
      
      // 保存进度
      currentProgressRef.current.userAnswers = newAnswers;
      await saveProgressImmediately(currentIndex, newAnswers);
      
    } catch (error: any) {
      console.error('[填空题评分失败]', error);
      alert('评分失败：' + (error.message || '未知错误'));
    } finally {
      setIsGradingFillBlank(false);
    }
  };

  // 简答题提交处理
  const handleSubmitShortAnswer = async () => {
    if (!currentQuestion || currentQuestion.type !== QuestionType.SHORT_ANSWER) return;
    
    if (!shortAnswer || shortAnswer.trim() === '') {
      return alert('请输入答案');
    }
    
    setIsGradingShortAnswer(true);
    
    try {
      // 如果启用了AI评分，调用AI评分API
      if (currentQuestion.aiGradingEnabled && currentQuestion.referenceAnswer) {
        const result = await store.gradeShortAnswer(
          currentQuestion.id,
          shortAnswer,
          currentQuestion.referenceAnswer
        );
        
        setShortAnswerResult(result);
      }
      
      setIsAnswered(true);
      setShowExplanation(true);
      
      // 保存用户答案
      const newAnswers = {
        ...userAnswers,
        [currentQuestion.id]: [shortAnswer]
      };
      setUserAnswers(newAnswers);
      
      // 简答题不自动判断对错，由AI评分或教师评分
      // 但仍然记录进度
      if (!isMockMode && !isMemoryMode && !sessionProgressRecorded.current.has(currentQuestion.id)) {
        store.incrementDailyProgress();
        sessionProgressRecorded.current.add(currentQuestion.id);
      }
      
      // 保存进度
      currentProgressRef.current.userAnswers = newAnswers;
      await saveProgressImmediately(currentIndex, newAnswers);
      
    } catch (error: any) {
      console.error('[简答题评分失败]', error);
      alert('评分失败：' + (error.message || '未知错误'));
    } finally {
      setIsGradingShortAnswer(false);
    }
  };

  const handleSrsMastery = async (level: 'HARD' | 'GOOD' | 'EASY') => {
    if (!currentQuestion || isSrsMasteryUpdated) return;
    await store.updateSrsRecord(currentQuestion.id, level);
    setIsSrsMasteryUpdated(true);
    setTimeout(handleNext, 400);
  };

  const calculateFinalScore = (isFinished: boolean = true) => {
    let score = 0;
    const wrongQuestionIds: string[] = [];
    const scoresConfig = bank?.scoreConfig || { [QuestionType.SINGLE]: 1, [QuestionType.MULTIPLE]: 2, [QuestionType.JUDGE]: 1 };
    questions.forEach(q => {
      const uAnswer = (userAnswers[q.id] || []).sort().join('');
      const correctStr = q.answer ? (Array.isArray(q.answer) ? [...q.answer].sort() : [q.answer]).join('') : '';
      if (uAnswer && uAnswer === correctStr) score += scoresConfig[q.type] || 0;
      else wrongQuestionIds.push(q.id);
    });
    const examData = exam?.exam || exam?.config || exam;
    const totalScore = examData?.totalScore || 100;
    const passScore = examData?.passScore || 60;
    return {
      score, totalScore, passScore, passed: score >= passScore,
      timeUsed: Math.floor((Date.now() - examStartTime) / 1000),
      wrongQuestionIds, userAnswers, currentIndex, isFinished,
      orderedQuestionIds: questions.map(q => q.id)
    };
  };

  useEffect(() => {
    if (!isMockMode) {
      if (currentQuestion?.type === QuestionType.MULTIPLE && (isSequentialMode || isMistakeMode || isSmartReviewMode)) {
        const alreadyConfirmed = confirmedIds.has(currentQuestion.id);
        setIsAnswered(alreadyConfirmed);
        setShowExplanation(isMemoryMode || alreadyConfirmed);
      } else {
        setIsAnswered(!!userAnswers[currentQuestion?.id]);
        setShowExplanation(isMemoryMode || isMistakeMode || isSmartReviewMode || !!userAnswers[currentQuestion?.id]);
      }
    }
    
    // 加载已保存的AI解析
    const loadSavedAnalysis = async () => {
      if (currentQuestion?.id) {
        try {
          const saved = await store.getAiAnalysis(currentQuestion.id);
          if (saved && saved.content) {
            setAiAnalysis(saved.content);
            console.log('[AI Analysis] 已加载保存的解析');
          } else {
            setAiAnalysis(null);
          }
        } catch (e) {
          console.error('[AI Analysis] 加载失败:', e);
          setAiAnalysis(null);
        }
      } else {
        setAiAnalysis(null);
      }
    };
    
    loadSavedAnalysis();
    setGroundingChunks([]);
  }, [currentIndex, isMemoryMode, isMistakeMode, isSequentialMode, isMockMode, isSmartReviewMode, userAnswers, currentQuestion?.id, confirmedIds, store]);

  const triggerArrows = useCallback(() => {
    setShowArrows(true);
    if (arrowTimerRef.current) window.clearTimeout(arrowTimerRef.current);
    arrowTimerRef.current = window.setTimeout(() => setShowArrows(false), 3000);
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => { triggerArrows(); };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      if (arrowTimerRef.current) window.clearTimeout(arrowTimerRef.current);
    };
  }, [triggerArrows]);

  // 触摸滑动处理
  const minSwipeDistance = 50;
  const maxSwipeDistance = 300; // 最大滑动距离，超过此距离不再增加偏移

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
    setIsTransitioning(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // 计算滑动距离
    const distance = currentTouch - touchStart;
    
    // 限制滑动距离，并添加阻尼效果
    let offset = distance;
    
    // 边界检查：如果已经是第一题，限制右滑；如果是最后一题，限制左滑
    if ((currentIndex === 0 && distance > 0) || (currentIndex === questions.length - 1 && distance < 0)) {
      // 添加阻尼效果：滑动距离越大，实际偏移越小
      offset = distance * 0.3;
    } else {
      // 正常滑动也添加轻微阻尼，让滑动更平滑
      if (Math.abs(distance) > maxSwipeDistance) {
        offset = Math.sign(distance) * (maxSwipeDistance + (Math.abs(distance) - maxSwipeDistance) * 0.2);
      }
    }
    
    setSwipeOffset(offset);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    setIsTransitioning(true);
    
    if (isLeftSwipe && currentIndex < questions.length - 1) {
      // 左滑切换到下一题
      handleNext();
    } else if (isRightSwipe && currentIndex > 0) {
      // 右滑切换到上一题
      handlePrev();
    }
    
    // 重置滑动状态
    setTimeout(() => {
      setSwipeOffset(0);
      setIsTransitioning(false);
      setTouchStart(null);
      setTouchEnd(null);
    }, 300);
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SINGLE: return '单选题';
      case QuestionType.MULTIPLE: return '多选题';
      case QuestionType.JUDGE: return '判断题';
      default: return '未知';
    }
  };

  const decodePCM = (base64: string, ctx: AudioContext) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const handleTtsRead = async () => {
    alert('语音朗读功能暂不支持。\n\nDeepSeek API 目前不提供 TTS（文本转语音）服务。\n如需此功能，请联系管理员配置其他 TTS 服务。');
  };

  const handleAIExplain = async () => {
    if (isAiLoading) return;
    
    // 调试：打印配置信息
    console.log('[AI Analysis] 当前用户:', store.currentUser?.id);
    console.log('[AI Analysis] 用户API Key:', store.currentUser?.deepseekApiKey);
    console.log('[AI Analysis] 系统配置:', store.systemConfig);
    console.log('[AI Analysis] 系统API Key:', store.systemConfig?.deepseekApiKey);
    
    // 获取有效的 API Key
    const apiKey = getEffectiveApiKey({
      userApiKey: store.currentUser?.deepseekApiKey,
      adminApiKey: store.systemConfig?.deepseekApiKey
    });
    
    console.log('[AI Analysis] 最终使用的API Key:', apiKey ? '已获取' : 'null');
    
    if (!apiKey) {
      alert(getApiKeyMissingMessage());
      return;
    }
    
    setIsAiLoading(true);
    try {
      const analysis = await generateQuestionAnalysis({
        apiKey,
        question: currentQuestion.content,
        options: currentQuestion.options,
        answer: currentQuestion.answer,
        explanation: currentQuestion.explanation
      });
      setAiAnalysis(analysis);
      setGroundingChunks([]); // DeepSeek 不提供 grounding chunks
      
      // 保存AI解析内容到数据库
      try {
        await store.saveAiAnalysis(currentQuestion.id, analysis);
        console.log('[AI Analysis] 解析内容已保存');
      } catch (saveError) {
        console.error('[AI Analysis] 保存失败:', saveError);
        // 保存失败不影响显示
      }
    } catch (e: any) {
      console.error('[AI Analysis Error]', e);
      setAiAnalysis(`解析加载失败：${e.message || '未知错误'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBaiduSearch = () => {
    const searchContent = `请解析题目：${currentQuestion.content}`;
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(searchContent)}`, '_blank');
  };

  if (!currentQuestion) return <div className="p-12 text-center text-gray-400 font-bold">无题目内容</div>;

  return (
    <div 
      className="max-w-4xl mx-auto space-y-2 md:space-y-6 flex flex-col min-h-full pb-32 md:pb-8 relative select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-between px-2 md:px-6">
        <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={currentIndex === 0} className={`pointer-events-auto w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-opacity shadow-xl ${showArrows && currentIndex > 0 ? 'opacity-100' : 'opacity-0 disabled:opacity-0'}`}><i className="fa-solid fa-chevron-left text-xl md:text-2xl"></i></button>
        <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className={`pointer-events-auto w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-opacity shadow-xl ${showArrows ? 'opacity-100' : 'opacity-0'}`}><i className="fa-solid fa-chevron-right text-xl md:text-2xl"></i></button>
      </div>

      <div className="flex items-center justify-between px-4 py-0.5 md:py-2 relative z-10">
        <button onClick={(e) => { e.stopPropagation(); handleExit(); }} className="text-gray-400 hover:text-indigo-600 font-black flex items-center gap-2"><i className="fa-solid fa-arrow-left-long"></i> {isMockMode ? '保存并退出' : '退出'}</button>
        <button onClick={(e) => { e.stopPropagation(); setIsNavOpen(true); }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-2xl text-xs font-black shadow-lg">{currentIndex + 1} / {questions.length} <i className="fa-solid fa-list-check ml-1"></i></button>
      </div>

      {/* 题目卡片容器 - 添加滑动动画 */}
      <div 
        className="relative"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
          opacity: Math.max(0.5, 1 - Math.abs(swipeOffset) / 400)
        }}
      >
        <div className={`bg-white rounded-[2.5rem] p-4 md:p-12 shadow-sm border border-gray-100 animate-in fade-in duration-500 z-10 ${feedbackClass}`}>
          <div className="flex justify-between items-start mb-4 md:mb-8">
             <div className="flex gap-2">
               <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">第 {currentIndex+1} 题</span>
               <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black">{getQuestionTypeLabel(currentQuestion.type)}</span>
               {isSmartReviewMode && <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-amber-100 shadow-sm"><i className="fa-solid fa-brain mr-1"></i> 智能复习</span>}
             </div>
             <div className="flex gap-3">
               <button onClick={(e) => { e.stopPropagation(); handleTtsRead(); }} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${isTtsLoading ? 'bg-indigo-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                 {isTtsLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-volume-high"></i>}
               </button>
               {!isMockMode && <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(currentQuestion); }} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${isFavorite ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-gray-50 border-gray-100 text-gray-300'}`}><i className={`fa-${isFavorite?'solid':'regular'} fa-star`}></i></button>}
             </div>
          </div>

          <h2 className="text-xl md:text-3xl font-black text-gray-900 leading-tight mb-6 md:mb-12">{currentQuestion.content}</h2>

        {/* 填空题渲染 */}
        {currentQuestion.type === QuestionType.FILL_IN_BLANK && (
          <div className="space-y-4 mb-8">
            {(currentQuestion.blanks || []).map((blank) => (
              <div key={blank.id} className="flex flex-col md:flex-row md:items-center gap-3">
                <label className="text-sm font-bold text-gray-700 min-w-[100px]">
                  空白 {blank.position}:
                </label>
                <input
                  type="text"
                  value={fillBlankAnswers[blank.id] || ''}
                  onChange={(e) => setFillBlankAnswers({
                    ...fillBlankAnswers,
                    [blank.id]: e.target.value
                  })}
                  disabled={isAnswered && !isMockMode}
                  className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="请输入答案"
                />
                {isAnswered && fillBlankResult && (
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      fillBlankResult.details.find((d: any) => d.blankId === blank.id)?.isCorrect
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}>
                      {fillBlankResult.details.find((d: any) => d.blankId === blank.id)?.isCorrect ? '✓ 正确' : '✗ 错误'}
                    </span>
                  </div>
                )}
              </div>
            ))}
            
            {!isAnswered && !isMemoryMode && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSubmitFillBlank(); }}
                disabled={isGradingFillBlank}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGradingFillBlank ? (
                  <><i className="fa-solid fa-spinner animate-spin mr-2"></i>评分中...</>
                ) : (
                  '提交答案'
                )}
              </button>
            )}
            
            {isAnswered && fillBlankResult && (
              <div className={`p-6 rounded-2xl border-2 ${
                fillBlankResult.isAllCorrect 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-black">
                    得分：<span className={fillBlankResult.isAllCorrect ? 'text-emerald-600' : 'text-amber-600'}>
                      {fillBlankResult.score}/100
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-600">
                    正确：{fillBlankResult.correct}/{fillBlankResult.total} ({fillBlankResult.percentage}%)
                  </div>
                </div>
                {!fillBlankResult.isAllCorrect && (
                  <div className="text-sm text-gray-600 mt-2">
                    <div className="font-bold mb-1">可接受的答案：</div>
                    {fillBlankResult.details.filter((d: any) => !d.isCorrect).map((d: any) => (
                      <div key={d.blankId} className="ml-4 text-xs">
                        • 空白 {(currentQuestion.blanks || []).find(b => b.id === d.blankId)?.position}: {d.acceptedAnswers.join('、')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 简答题渲染 */}
        {currentQuestion.type === QuestionType.SHORT_ANSWER && (
          <div className="space-y-4 mb-8">
            <textarea
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              disabled={isAnswered && !isMockMode}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium h-48 resize-none disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="请输入你的答案..."
            />
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>字数：{shortAnswer.length}</span>
              {currentQuestion.aiGradingEnabled && (
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  AI评分已启用
                </span>
              )}
            </div>
            
            {!isAnswered && !isMemoryMode && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSubmitShortAnswer(); }}
                disabled={isGradingShortAnswer}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGradingShortAnswer ? (
                  <><i className="fa-solid fa-spinner animate-spin mr-2"></i>评分中...</>
                ) : (
                  '提交答案'
                )}
              </button>
            )}
            
            {isAnswered && shortAnswerResult && (
              <div className="p-6 rounded-2xl border-2 bg-indigo-50 border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fa-solid fa-wand-magic-sparkles text-indigo-600"></i>
                  <span className="text-lg font-black text-indigo-900">AI评分结果</span>
                </div>
                <div className="mb-4">
                  <div className="text-3xl font-black text-indigo-600 mb-1">{shortAnswerResult.score}分</div>
                  <div className="text-sm text-gray-600">{shortAnswerResult.feedback}</div>
                </div>
                {shortAnswerResult.suggestions && shortAnswerResult.suggestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-indigo-200">
                    <div className="text-sm font-bold text-gray-700 mb-2">改进建议：</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {shortAnswerResult.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-400">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 选择题选项渲染 */}
        {(currentQuestion.type === QuestionType.SINGLE || 
          currentQuestion.type === QuestionType.MULTIPLE || 
          currentQuestion.type === QuestionType.JUDGE) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {currentQuestion.options.map((opt, idx) => {
            const label = String.fromCharCode(65+idx);
            const isSelected = (userAnswers[currentQuestion.id] || []).includes(label);
            let style = "bg-white border-gray-100 text-gray-700";
            if (isSelected) style = "border-indigo-600 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-100";
            if (!isMockMode && (isAnswered || isMemoryMode)) {
              const isCorrect = (Array.isArray(currentQuestion.answer) ? currentQuestion.answer.includes(label) : currentQuestion.answer === label);
              if (isCorrect) style = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100";
              else if (isSelected) style = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-100";
              else style = "opacity-60 border-gray-100 bg-white text-gray-500";
            }
            return (
              <button key={idx} onClick={(e) => { e.stopPropagation(); handleOptionClick(label); }} className={`p-3 md:p-5 text-left rounded-3xl border-2 transition-all flex items-center gap-4 ${style}`}>
                <div className="w-10 h-10 rounded-2xl bg-white border-2 flex items-center justify-center font-black">{label}</div>
                <span className="font-bold text-sm md:text-base">{opt}</span>
              </button>
            );
          })}
        </div>
        )}

        {!isMockMode && !isAnswered && !isMemoryMode && currentQuestion.type === QuestionType.MULTIPLE && (
          <div className="mt-8"><button onClick={(e) => { e.stopPropagation(); handleConfirmMultiple(); }} disabled={(userAnswers[currentQuestion.id] || []).length === 0} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg disabled:opacity-50">确认选择</button></div>
        )}

        {/* 上一题/下一题按钮 - 移到选项下方 */}
        {!isMockMode && (isSequentialMode || isMemoryMode) && (
          <div className="mt-8 flex gap-4">
            <button disabled={currentIndex === 0} onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="flex-1 py-4 bg-white border border-gray-100 rounded-[1.5rem] font-black text-gray-400 disabled:opacity-20 hover:bg-gray-50 transition-colors">
              <i className="fa-solid fa-chevron-left mr-2"></i>上一题
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-indigo-700 transition-colors">
              {currentIndex === questions.length - 1 ? '完成练习' : '下一题'}<i className="fa-solid fa-chevron-right ml-2"></i>
            </button>
          </div>
        )}

        {!isMockMode && (isAnswered || isMemoryMode) && (isSmartReviewMode || isMistakeMode) && (
          <div className="mt-10 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 animate-in slide-in-from-bottom-2 duration-300">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">请评估此题的掌握程度</div>
                <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                   <button 
                    onClick={() => handleSrsMastery('HARD')}
                    className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-rose-100 hover:border-rose-500 transition-all group"
                   >
                     <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <i className="fa-solid fa-rotate-right text-xs"></i>
                     </div>
                     <span className="text-[10px] font-black text-rose-600">很难/重来</span>
                   </button>
                   <button 
                    onClick={() => handleSrsMastery('GOOD')}
                    className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-indigo-100 hover:border-indigo-500 transition-all group"
                   >
                     <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <i className="fa-solid fa-thumbs-up text-xs"></i>
                     </div>
                     <span className="text-[10px] font-black text-indigo-600">已掌握</span>
                   </button>
                   <button 
                    onClick={() => handleSrsMastery('EASY')}
                    className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-emerald-100 hover:border-emerald-500 transition-all group"
                   >
                     <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <i className="fa-solid fa-bolt-lightning text-xs"></i>
                     </div>
                     <span className="text-[10px] font-black text-emerald-600">太简单了</span>
                   </button>
                </div>
                <p className="text-[9px] text-gray-400 font-medium italic">* 系统将自动安排下一次最佳复习时机</p>
             </div>
          </div>
        )}

        {!isMockMode && (isAnswered || isMemoryMode) && (
          <div className="mt-12 flex flex-col gap-6">
             <div className="flex flex-wrap gap-3">
               <button onClick={(e) => { e.stopPropagation(); handleAIExplain(); }} disabled={isAiLoading} className="bg-indigo-900 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg">{isAiLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} AI 深度解析</button>
               <button onClick={(e) => { e.stopPropagation(); handleBaiduSearch(); }} className="bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2">百度搜索</button>
             </div>
             
             {showExplanation && (
               <div className="w-full space-y-4">
                 <div className="w-full p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                   {currentQuestion.type === QuestionType.SHORT_ANSWER ? (
                     <>
                       <div className="text-indigo-600 font-black mb-2">参考答案：</div>
                       <div className="text-amber-800 text-sm font-medium whitespace-pre-wrap">{currentQuestion.referenceAnswer}</div>
                     </>
                   ) : (
                     <>
                       <div className="text-emerald-600 font-black mb-2">正确答案：{Array.isArray(currentQuestion.answer) ? currentQuestion.answer.join('') : currentQuestion.answer}</div>
                       <div className="text-amber-800 text-sm font-medium">{currentQuestion.explanation}</div>
                     </>
                   )}
                 </div>

                 <div className="w-full p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 transition-all" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-note-sticky text-indigo-600"></i>
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">个人随手笔记</span>
                      </div>
                      {lastSaved && (
                        <span className="text-[10px] font-bold text-emerald-500 animate-pulse">
                          <i className="fa-solid fa-circle-check mr-1"></i> 已于 {lastSaved} 保存
                        </span>
                      )}
                    </div>
                    <textarea 
                      className="w-full bg-white/60 rounded-2xl p-4 text-sm font-medium h-32 outline-none focus:ring-2 focus:ring-indigo-200 border-none transition-all resize-none placeholder:text-indigo-200"
                      value={personalNote}
                      onChange={(e) => setPersonalNote(e.target.value)}
                      onBlur={handleSaveNote}
                      placeholder="记录你的记忆技巧、疑点或关联知识点..."
                    />
                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSaveNote(); }}
                        disabled={isSavingNote}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-sm active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isSavingNote ? <i className="fa-solid fa-spinner animate-spin"></i> : '立即保存'}
                      </button>
                    </div>
                 </div>
               </div>
             )}

             {aiAnalysis && (
               <div className="w-full p-8 bg-indigo-900 text-indigo-50 rounded-[2.5rem] border border-indigo-950 animate-in slide-in-from-top-4">
                 <div className="flex items-center gap-2 mb-4">
                   <i className="fa-solid fa-wand-magic-sparkles text-indigo-300"></i>
                   <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">AI 深度复盘</span>
                 </div>
                 <div className="markdown-body text-sm leading-relaxed text-indigo-50" dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(aiAnalysis) }} />
                 {groundingChunks.length > 0 && (
                   <div className="mt-6 pt-6 border-t border-indigo-800 flex flex-wrap gap-2">
                     {groundingChunks.map((chunk, i) => chunk.web && (
                       <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-indigo-200 hover:bg-white/20 transition-colors">
                         <i className="fa-solid fa-link"></i> {chunk.web.title}
                       </a>
                     ))}
                   </div>
                 )}
               </div>
             )}
          </div>
        )}
        </div>
      </div>

      {/* 底部按钮 - 只在模拟考试、错题模式和智能复习模式下显示 */}
      {(isMockMode || isMistakeMode || isSmartReviewMode) && (
        <div className="flex gap-4 p-4 md:p-0 relative z-10">
          <button disabled={currentIndex === 0} onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="flex-1 py-4 bg-white border border-gray-100 rounded-[1.5rem] font-black text-gray-400 disabled:opacity-20 hover:bg-gray-50 transition-colors">
            <i className="fa-solid fa-chevron-left mr-2"></i>上一题
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-indigo-700 transition-colors">
            {currentIndex === questions.length - 1 ? (isMockMode ? '提交试卷' : '完成复习') : '下一题'}<i className="fa-solid fa-chevron-right ml-2"></i>
          </button>
        </div>
      )}

      {isNavOpen && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setIsNavOpen(false); }}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl font-black text-gray-900">答题卡</h3>
              <button onClick={() => setIsNavOpen(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            {/* 快速导航栏 */}
            <div className="flex gap-2 mb-6 shrink-0 overflow-x-auto pb-2 custom-scrollbar">
              {groupedNavItems.map((group, idx) => (
                <button
                  key={group.label}
                  onClick={() => {
                    const firstItem = group.items[0];
                    if (firstItem) {
                      setCurrentIndex(firstItem.index);
                      setIsNavOpen(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100"
                >
                  <i className={`fa-solid ${
                    group.label.includes('单选') ? 'fa-circle-dot' :
                    group.label.includes('多选') ? 'fa-square-check' :
                    'fa-circle-question'
                  } mr-1.5`}></i>
                  {group.label} ({group.items.length})
                </button>
              ))}
            </div>
            
            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-3 mb-6 shrink-0">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-3 text-center">
                <div className="text-2xl font-black text-indigo-600">{questions.length}</div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-1">总题数</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-3 text-center">
                <div className="text-2xl font-black text-emerald-600">{Object.keys(userAnswers).length}</div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1">已答题</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-3 text-center">
                <div className="text-2xl font-black text-amber-600">{questions.length - Object.keys(userAnswers).length}</div>
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-1">未答题</div>
              </div>
            </div>
            
            {/* 题目列表 */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
               {groupedNavItems.map((group) => (
                 <div key={group.label} className="space-y-3">
                    <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10">
                       <div className="flex items-center gap-2">
                         <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                         <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">{group.label}</h4>
                       </div>
                       <span className="text-xs font-bold text-gray-400">{group.items.length}题</span>
                    </div>
                    <div className="grid grid-cols-5 md:grid-cols-6 gap-2.5">
                      {group.items.map((item) => {
                        const isAnswered = !!userAnswers[item.id];
                        const isCurrent = currentIndex === item.index;
                        return (
                          <button 
                            key={item.id} 
                            onClick={() => { setCurrentIndex(item.index); setIsNavOpen(false); }} 
                            className={`aspect-square rounded-xl font-black text-sm border-2 transition-all relative ${
                              isCurrent
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' 
                                : isAnswered
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
                                  : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {item.index + 1}
                            {isAnswered && !isCurrent && (
                              <i className="fa-solid fa-check absolute top-0.5 right-0.5 text-[8px] text-emerald-500"></i>
                            )}
                          </button>
                        );
                      })}
                    </div>
                 </div>
               ))}
            </div>
            
            {/* 底部操作栏 */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100 shrink-0">
              <button
                onClick={() => {
                  // 跳转到第一题未答的题目
                  const firstUnanswered = questions.findIndex(q => !userAnswers[q.id]);
                  if (firstUnanswered !== -1) {
                    setCurrentIndex(firstUnanswered);
                    setIsNavOpen(false);
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
              >
                <i className="fa-solid fa-forward mr-2"></i>
                跳至未答题
              </button>
              <button
                onClick={() => setIsNavOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeModeView;
