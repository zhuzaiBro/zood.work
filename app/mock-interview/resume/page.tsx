'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResumeInterviewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(2);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Form Step 2 Data
  const [basicInfo, setBasicInfo] = useState({
    position: 'Java后端开发',
    language: 'Python',
    recruitmentType: '社招',
  });

  // Form Step 3 Data
  const [resumeData, setResumeData] = useState({
    imported: false,
    fileName: '简历_2025/12/1.pdf',
    content: ''
  });

  const steps = [
    { number: 1, title: '面试类型', completed: true },
    { number: 2, title: '填写基本信息', completed: currentStep > 2, current: currentStep === 2, pending: currentStep < 2 },
    { number: 3, title: '选择简历', completed: currentStep > 3, current: currentStep === 3, pending: currentStep < 3 },
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPreviewModal(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/mock-interview');
    }
  };

  const handleCreate = () => {
    console.log('Creating resume interview:', { basicInfo, resumeData });
    // Simulate creation
    setTimeout(() => {
      router.push('/mock-interview');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <Link href="/mock-interview" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">简历押题</h1>
          <p className="text-gray-500">创建简历押题，生成押题列表，助你面试开挂</p>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-3 relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors
                      ${step.completed 
                        ? 'bg-yellow-50 text-yellow-600' 
                        : step.current 
                          ? 'bg-yellow-400 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-400'
                      }
                    `}
                  >
                    {step.completed ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span 
                    className={`font-medium whitespace-nowrap ${
                      step.current ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${step.completed ? 'bg-yellow-200' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm p-8 min-h-[500px] flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1 space-y-8 py-4">
            
            {/* Step 2: 基本信息 */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                {/* 目标岗位 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">目标岗位</label>
                  <div className="col-span-9">
                    <select 
                      value={basicInfo.position}
                      onChange={(e) => setBasicInfo({...basicInfo, position: e.target.value})}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all appearance-none"
                    >
                      <option value="Java后端开发">Java后端开发</option>
                      <option value="前端开发">前端开发</option>
                      <option value="全栈开发">全栈开发</option>
                      <option value="Python开发">Python开发</option>
                      <option value="Go开发">Go开发</option>
                    </select>
                  </div>
                </div>

                {/* 编程语言 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">编程语言</label>
                  <div className="col-span-9">
                    <select 
                      value={basicInfo.language}
                      onChange={(e) => setBasicInfo({...basicInfo, language: e.target.value})}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all appearance-none"
                    >
                      <option value="Java">Java</option>
                      <option value="Python">Python</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="Go">Go</option>
                      <option value="C++">C++</option>
                    </select>
                  </div>
                </div>

                {/* 招聘类型 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">招聘类型</label>
                  <div className="col-span-9">
                    <select 
                      value={basicInfo.recruitmentType}
                      onChange={(e) => setBasicInfo({...basicInfo, recruitmentType: e.target.value})}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all appearance-none"
                    >
                      <option value="社招">社招</option>
                      <option value="校招">校招</option>
                      <option value="实习">实习</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 选择简历 */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fade-in">
                 <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900">选择简历</h2>
                  <p className="text-gray-500 mt-2 text-sm">请选择您的简历信息</p>
                </div>

                <div className="grid grid-cols-12 gap-4 items-start">
                  <label className="col-span-2 text-right font-medium text-gray-700 pt-2">我的简历</label>
                  <div className="col-span-10">
                    <div className="flex items-center gap-3 mb-4">
                      <button 
                        onClick={() => setResumeData({...resumeData, imported: true})}
                        className="px-4 py-1.5 bg-yellow-400 text-white text-sm font-medium rounded-md hover:bg-yellow-500 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        从本地导入
                      </button>
                    </div>
                    
                    {!resumeData.imported ? (
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center h-64">
                        <p className="text-gray-500 mb-3">还没有简历？可以使用在线工具快速创建</p>
                        <a href="#" className="text-yellow-500 hover:text-yellow-600 hover:underline flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          前往ZOOD简历创建
                        </a>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 w-64 relative group cursor-pointer hover:shadow-md transition-all">
                        <div className="aspect-[3/4] bg-white rounded-lg mb-3 p-2 shadow-sm opacity-80 blur-[1px]">
                          <div className="space-y-2">
                            <div className="h-2 w-1/3 bg-gray-200 rounded"></div>
                            <div className="h-2 w-full bg-gray-100 rounded"></div>
                            <div className="h-2 w-full bg-gray-100 rounded"></div>
                            <div className="h-2 w-2/3 bg-gray-100 rounded"></div>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-yellow-500">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                             </svg>
                           </div>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                           <div>
                             <div className="font-medium text-gray-900">简历</div>
                             <div className="text-xs text-gray-500">2025/12/1</div>
                           </div>
                           <span className="text-xs text-yellow-600 hover:underline">查看简历</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-100">
            <button
              onClick={handlePrev}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              上一步
            </button>

            <div className="flex gap-4">
              {/* Only show in Step 2 */}
              <button className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                模板管理
              </button>
              <button 
                onClick={handleNext}
                className="px-8 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {currentStep === 3 ? '创建押题' : '下一步'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

       {/* Payment Confirmation Modal */}
       {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 animate-slide-up relative">
            <button 
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">押题配置预览</h3>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-baseline gap-3">
                 <span className="text-gray-500 shrink-0 w-20 text-right">目标岗位:</span>
                 <span className="text-gray-900 font-medium text-lg">{basicInfo.position}</span>
              </div>
              
              <div className="flex items-baseline gap-3">
                 <span className="text-gray-500 shrink-0 w-20 text-right">编程语言:</span>
                 <span className="text-gray-900 font-medium text-lg">{basicInfo.language}</span>
              </div>

              <div className="flex items-baseline gap-3">
                 <span className="text-gray-500 shrink-0 w-20 text-right">招聘类型:</span>
                 <span className="text-gray-900 font-medium text-lg">{basicInfo.recruitmentType}</span>
              </div>
              
              <div className="pt-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 mt-6">
                  确认无误，可消耗 <span className="text-yellow-500 font-bold text-xl mx-1">⚡ 50</span> <span className="text-gray-400 line-through">(原价200能量值)</span> 创建押题。
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                修改配置
              </button>
              <button 
                onClick={handleCreate}
                className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-lg shadow-lg shadow-yellow-100 transition-all transform hover:-translate-y-0.5"
              >
                创建押题
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

