'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ComprehensiveInterviewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(2);
  
  // Form Step 2 Data
  const [positionData, setPositionData] = useState({
    position: 'Java后端开发',
    experience: '校招应届',
    salaryMin: '8',
    salaryMax: '13',
    jd: '岗位职责\n1、在导师指导下参与后端模块开发与联调；\n2、编写基础功能与单元测试，确保功能正确性；\n3、学习并应用团队编码规范与工具链；',
  });
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);

  // Form Step 3 Data
  const [personalData, setPersonalData] = useState({
    description: '',
    resumeImported: false
  });
  const [showSupplementaryInfo, setShowSupplementaryInfo] = useState(false);

  // Form Step 4 Data
  const [settingsData, setSettingsData] = useState({
    focus: '综合面试',
    duration: '60 分钟',
    difficulty: '中等',
    interviewer: 'ZOOD',
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const steps = [
    { number: 1, title: '面试类型', completed: true },
    { number: 2, title: '目标岗位', completed: currentStep > 2, current: currentStep === 2, pending: currentStep < 2 },
    { number: 3, title: '个人信息', completed: currentStep > 3, current: currentStep === 3, pending: currentStep < 3 },
    { number: 4, title: '面试设置', completed: currentStep > 4, current: currentStep === 4, pending: currentStep < 4 },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPreviewModal(true);
    }
  };

  const handleCreateInterview = () => {
    // TODO: Implement actual creation logic
    console.log('Creating interview:', { positionData, personalData, settingsData });
    // Simulate success
    setTimeout(() => {
      router.push('/mock-interview');
    }, 1000);
  };

  const handlePrev = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/mock-interview');
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">综合面试</h1>
          <p className="text-gray-500">沉浸式综合面试，检验实力，告别临场紧张</p>
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
                        ? 'bg-blue-50 text-blue-600' 
                        : step.current 
                          ? 'bg-blue-600 text-white shadow-sm' 
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
                  <div className={`flex-1 h-0.5 mx-4 ${step.completed ? 'bg-blue-200' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm p-8 min-h-[600px] flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1 space-y-8 py-4">
            
            {/* Step 2: 目标岗位 */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                {/* 岗位名称 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">岗位名称</label>
                  <div className="col-span-9">
                    <select 
                      value={positionData.position}
                      onChange={(e) => setPositionData({...positionData, position: e.target.value})}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="Java后端开发">Java后端开发</option>
                      <option value="前端开发">前端开发</option>
                      <option value="全栈开发">全栈开发</option>
                    </select>
                  </div>
                </div>

                {/* 工作年限 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">工作年限</label>
                  <div className="col-span-9">
                    <select 
                      value={positionData.experience}
                      onChange={(e) => setPositionData({...positionData, experience: e.target.value})}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="校招应届">校招应届</option>
                      <option value="1-3年">1-3年</option>
                      <option value="3-5年">3-5年</option>
                      <option value="5年以上">5年以上</option>
                    </select>
                  </div>
                </div>

                {/* 薪资范围 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">薪资范围</label>
                  <div className="col-span-9 flex items-center gap-3">
                    <input 
                      type="number" 
                      value={positionData.salaryMin}
                      onChange={(e) => setPositionData({...positionData, salaryMin: e.target.value})}
                      className="w-32 p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-center"
                    />
                    <span className="text-gray-400">~</span>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={positionData.salaryMax}
                        onChange={(e) => setPositionData({...positionData, salaryMax: e.target.value})}
                        className="w-40 p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 pl-4 pr-12 text-center"
                      />
                      <span className="absolute right-0 top-0 bottom-0 flex items-center px-3 bg-gray-50 border-l border-gray-200 rounded-r-lg text-gray-500 text-sm">
                        K/月
                      </span>
                    </div>
                  </div>
                </div>

                {/* 岗位描述 */}
                <div className="grid grid-cols-12 gap-4 items-start">
                  <label className="col-span-3 text-right font-medium text-gray-700 pt-2">岗位描述</label>
                  <div className="col-span-9 relative">
                    <textarea 
                      value={positionData.jd}
                      onChange={(e) => setPositionData({...positionData, jd: e.target.value})}
                      rows={6}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-sm leading-relaxed"
                      placeholder="请输入岗位职责和要求..."
                    />
                    <div className="absolute bottom-3 right-3 text-gray-400 text-xs">
                      {positionData.jd.length} / 500
                    </div>
                  </div>
                </div>

                {/* 公司信息配置 (Collapsible) */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3"></div>
                  <div className="col-span-9">
                    <button 
                      onClick={() => setShowCompanyInfo(!showCompanyInfo)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${showCompanyInfo ? 'rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      公司信息配置（可选）
                    </button>
                    
                    {showCompanyInfo && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-blue-500" placeholder="请输入公司名称" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">所属行业</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-blue-500" placeholder="例如：互联网/电商" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 个人信息 */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900">选择简历</h2>
                </div>

                {/* Resume Selection */}
                <div className="grid grid-cols-12 gap-4 items-start">
                  <label className="col-span-2 text-right font-medium text-gray-700 pt-2">我的简历</label>
                  <div className="col-span-10">
                    <div className="flex items-center gap-3 mb-4">
                      <button className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        从本地导入
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                      <p className="text-gray-500 mb-3">还没有简历？可以使用在线工具快速创建</p>
                      <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        前往ZOOD简历创建
                      </a>
                    </div>
                  </div>
                </div>

                {/* Personal Description */}
                <div className="grid grid-cols-12 gap-4 items-start mt-8">
                  <label className="col-span-2 text-right font-medium text-gray-700 pt-2">个人描述</label>
                  <div className="col-span-10 relative">
                    <textarea 
                      value={personalData.description}
                      onChange={(e) => setPersonalData({...personalData, description: e.target.value})}
                      rows={6}
                      className="w-full p-4 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-sm leading-relaxed placeholder-gray-300"
                      placeholder="例如：5年Java后端开发经验，熟悉Spring Boot、微服务架构，有大型项目经验..."
                    />
                    <div className="absolute bottom-3 right-3 text-gray-400 text-xs">
                      {personalData.description.length} / 2000
                    </div>
                  </div>
                </div>

                {/* Supplementary Info (Optional) */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-2"></div>
                  <div className="col-span-10">
                    <button 
                      onClick={() => setShowSupplementaryInfo(!showSupplementaryInfo)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${showSupplementaryInfo ? 'rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      补充信息（可选）
                    </button>
                    
                    {showSupplementaryInfo && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">其他技能</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-blue-500" placeholder="请输入其他相关技能" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: 面试设置 */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-fade-in">
                {/* 面试重点 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">面试重点</label>
                  <div className="col-span-9">
                    <select 
                      value={settingsData.focus}
                      onChange={(e) => setSettingsData({...settingsData, focus: e.target.value})}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none text-gray-500 cursor-not-allowed"
                      disabled
                    >
                      <option value="综合面试">综合面试</option>
                    </select>
                  </div>
                </div>

                {/* 面试时长 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">面试时长</label>
                  <div className="col-span-9">
                    <select 
                      value={settingsData.duration}
                      onChange={(e) => setSettingsData({...settingsData, duration: e.target.value})}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="30 分钟">30 分钟</option>
                      <option value="45 分钟">45 分钟</option>
                      <option value="60 分钟">60 分钟</option>
                      <option value="90 分钟">90 分钟</option>
                    </select>
                  </div>
                </div>

                {/* 面试难度 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">面试难度</label>
                  <div className="col-span-9">
                    <select 
                      value={settingsData.difficulty}
                      onChange={(e) => setSettingsData({...settingsData, difficulty: e.target.value})}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="简单">简单</option>
                      <option value="中等">中等</option>
                      <option value="困难">困难</option>
                      <option value="专家">专家</option>
                    </select>
                  </div>
                </div>

                {/* 面试官选择 */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">面试官选择</label>
                  <div className="col-span-9">
                    <select 
                      value={settingsData.interviewer}
                      onChange={(e) => setSettingsData({...settingsData, interviewer: e.target.value})}
                      className="w-full p-2.5 bg-white border border-blue-500 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none text-gray-900"
                    >
                      <option value="ZOOD">ZOOD</option>
                      <option value="兵哥">兵哥</option>
                      <option value="Alan">Alan</option>
                    </select>
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
              <button className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                模板管理
              </button>
              <button 
                onClick={handleNext}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {currentStep === 4 ? '预览配置' : '下一步'}
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

            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">面试配置预览</h3>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-baseline gap-3">
                 <span className="text-gray-500 shrink-0 w-12 text-right">岗位:</span>
                 <span className="text-gray-900 font-bold text-lg">
                   {positionData.position} 
                   <span className="text-gray-500 font-normal text-base ml-2">({positionData.experience})</span>
                 </span>
              </div>
              
              <div className="flex items-baseline gap-3">
                 <span className="text-gray-500 shrink-0 w-12 text-right">重点:</span>
                 <span className="text-gray-900 font-medium text-lg">{settingsData.focus}</span>
              </div>
              
               <div className="flex items-center gap-8">
                  <div className="flex items-baseline gap-3">
                     <span className="text-gray-500 shrink-0 w-12 text-right">时长:</span>
                     <span className="text-gray-900 font-bold text-lg">{settingsData.duration}</span>
                  </div>
                   <div className="flex items-baseline gap-3">
                     <span className="text-gray-500 shrink-0">难度:</span>
                     <span className="text-gray-900 font-bold text-lg">{settingsData.difficulty}</span>
                  </div>
              </div>
              
              <div className="pt-6 text-sm text-gray-500 leading-relaxed">
                  确认无误，可消耗 <span className="text-yellow-500 font-bold text-xl mx-1">⚡ 200</span> <span className="text-gray-400 line-through">(原价600能量值)</span> 创建面试。
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
                onClick={handleCreateInterview}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
              >
                创建面试
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
