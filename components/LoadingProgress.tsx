import React, { useState, useEffect } from 'react';

interface LoadingProgressProps {
  stages: Array<{
    name: string;
    completed: boolean;
  }>;
  show: boolean;
}

/**
 * 加载进度条组件
 * 显示多阶段加载的进度
 */
const LoadingProgress: React.FC<LoadingProgressProps> = ({ stages, show }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (!show) {
      setProgress(0);
      return;
    }
    
    // 计算完成百分比
    const completedCount = stages.filter(s => s.completed).length;
    const totalCount = stages.length;
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    // 平滑过渡
    const timer = setTimeout(() => {
      setProgress(percentage);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [stages, show]);
  
  if (!show) {
    return null;
  }
  
  const completedCount = stages.filter(s => s.completed).length;
  const currentStage = stages.find(s => !s.completed);
  
  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl p-6 w-80 animate-in slide-in-from-bottom-4 z-50">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
          <i className="fa-solid fa-download text-indigo-600"></i>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">正在加载数据</h3>
          <p className="text-xs text-gray-500">
            {completedCount} / {stages.length} 已完成
          </p>
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="mb-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* 当前阶段 */}
      {currentStage && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>{currentStage.name}</span>
        </div>
      )}
      
      {/* 阶段列表 */}
      <div className="mt-4 space-y-2">
        {stages.map((stage, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-2 text-xs transition-all duration-300 ${
              stage.completed ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {stage.completed ? (
              <i className="fa-solid fa-check-circle"></i>
            ) : (
              <i className="fa-regular fa-circle"></i>
            )}
            <span>{stage.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingProgress;
