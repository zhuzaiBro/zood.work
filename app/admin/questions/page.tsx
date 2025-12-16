'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import { UserProfile } from '@/types/user';

type Collection = Database['public']['Tables']['interview_collections']['Row'];
type Question = Database['public']['Tables']['interview_question']['Row'];

interface ParsedQuestion {
  title: string;
  content: string;
  is_vip: boolean;
  difficulty: string | null;
  vip_level_required: number | null;
  sort: number | null;
}

export default function QuestionsManagePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  
  // 题目列表相关状态
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [filterCollectionId, setFilterCollectionId] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 20;

  // 检查用户权限
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    setIsCheckingAuth(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/admin/questions');
      return;
    }

    // 检查管理员权限
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single<UserProfile>();

    if (error || !profile?.is_admin) {
      setHasPermission(false);
      setIsCheckingAuth(false);
      return;
    }

    // 权限验证通过，加载题集和题目
    setHasPermission(true);
    setIsCheckingAuth(false);
    loadCollections();
    loadQuestions();
  };

  const loadCollections = async () => {
    const { data, error } = await supabase
      .from('interview_collections')
      .select('*')
      .order('sort', { ascending: true });

    if (error) {
      console.error('加载题集失败:', error);
      return;
    }

    setCollections(data || []);
  };

  const loadQuestions = async () => {
    setIsLoadingQuestions(true);
    
    let query = supabase
      .from('interview_question')
      .select('*')
      .order('created_at', { ascending: false });

    // 根据题集筛选
    if (filterCollectionId) {
      query = query.eq('collection_id', filterCollectionId);
    }

    // 根据关键词搜索
    if (searchKeyword.trim()) {
      query = query.ilike('title', `%${searchKeyword}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('加载题目失败:', error);
      setError('加载题目失败');
    } else {
      setQuestions(data || []);
    }

    setIsLoadingQuestions(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('确定要删除这道题目吗？此操作无法撤销。')) {
      return;
    }

    const { error } = await supabase
      .from('interview_question')
      .delete()
      .eq('id', questionId);

    if (error) {
      setError('删除失败: ' + error.message);
    } else {
      setSuccess('题目已删除');
      loadQuestions();
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;

    const { error } = await supabase
      .from('interview_question')
      // @ts-expect-error - Supabase type inference issue with update method
      .update({
        title: editingQuestion.title,
        content: editingQuestion.content,
        difficulty: editingQuestion.difficulty,
        is_vip: editingQuestion.is_vip,
        vip_level_required: editingQuestion.vip_level_required,
        sort: editingQuestion.sort,
      })
      .eq('id', editingQuestion.id);

    if (error) {
      setError('保存失败: ' + error.message);
    } else {
      setSuccess('题目已更新');
      setShowEditModal(false);
      setEditingQuestion(null);
      loadQuestions();
    }
  };

  // 监听筛选条件变化
  useEffect(() => {
    if (hasPermission) {
      loadQuestions();
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCollectionId, searchKeyword]);

  // 分页计算
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const paginatedQuestions = questions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

  const getCollectionName = (collectionId: string | null) => {
    if (!collectionId) return '未分类';
    const collection = collections.find(c => c.id === collectionId);
    return collection?.title || '未知题集';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('请上传 CSV 文件');
        return;
      }
      setCsvFile(file);
      setParsedData([]);
      setError('');
      setSuccess('');
    }
  };

  const parseCSV = (text: string): ParsedQuestion[] => {
    const lines = text.split('\n');
    if (lines.length < 2) {
      throw new Error('CSV 文件为空');
    }

    // 解析表头
    const header = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['title', 'content', 'is_vip', 'difficulty'];
    const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`缺少必需的列: ${missingHeaders.join(', ')}`);
    }

    const questions: ParsedQuestion[] = [];
    let currentLine = '';
    let inQuotes = false;

    // 解析数据行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // 处理多行内容（用双引号包裹的内容可能包含换行）
      currentLine += (currentLine ? '\n' : '') + line;
      
      // 计算引号数量来判断是否在引号内
      const quoteCount = (currentLine.match(/"/g) || []).length;
      inQuotes = quoteCount % 2 !== 0;

      if (inQuotes) {
        continue; // 继续读取下一行
      }

      // 解析当前完整的行
      if (currentLine.trim()) {
        try {
          const values = parseCSVLine(currentLine);
          const row: any = {};
          header.forEach((key, index) => {
            row[key] = values[index] || '';
          });

          if (row.title && row.content) {
            questions.push({
              title: row.title.trim(),
              content: row.content.trim(),
              is_vip: row.is_vip === 'true',
              difficulty: row.difficulty?.trim() || null,
              vip_level_required: row.vip_level_required ? parseInt(row.vip_level_required) : null,
              sort: row.sort ? parseInt(row.sort) : null,
            });
          }
        } catch (err) {
          console.error(`解析第 ${i + 1} 行失败:`, err);
        }
      }

      currentLine = '';
    }

    return questions;
  };

  // 解析 CSV 行（处理引号和逗号）
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // 转义的引号
          current += '"';
          i++;
        } else {
          // 切换引号状态
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // 字段分隔符
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const handleParseCSV = async () => {
    if (!csvFile) {
      setError('请选择 CSV 文件');
      return;
    }

    if (!selectedCollectionId) {
      setError('请选择题集');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const text = await csvFile.text();
      const questions = parseCSV(text);

      if (questions.length === 0) {
        throw new Error('未找到有效的题目数据');
      }

      setParsedData(questions);
      setSuccess(`成功解析 ${questions.length} 条题目，请检查预览后点击"开始导入"`);
    } catch (err: any) {
      setError(`解析失败: ${err.message}`);
      setParsedData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError('没有可导入的数据');
      return;
    }

    if (!selectedCollectionId) {
      setError('请选择题集');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress({ current: 0, total: parsedData.length });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // 逐条导入（避免批量导入时部分失败难以追踪）
    for (let i = 0; i < parsedData.length; i++) {
      const question = parsedData[i];
      setUploadProgress({ current: i + 1, total: parsedData.length });

      const { error } = await supabase
        .from('interview_question')
        // @ts-expect-error - Supabase type inference issue with insert method
        .insert({
          collection_id: selectedCollectionId,
          title: question.title,
          content: question.content,
          is_vip: question.is_vip,
          difficulty: question.difficulty,
          vip_level_required: question.vip_level_required,
          sort: question.sort,
        });

      if (error) {
        failCount++;
        errors.push(`第 ${i + 1} 条 "${question.title}": ${error.message}`);
      } else {
        successCount++;
      }
    }

    setIsLoading(false);
    setUploadProgress({ current: 0, total: 0 });

    if (failCount === 0) {
      setSuccess(`✅ 成功导入 ${successCount} 条题目！`);
      setParsedData([]);
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setError(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条\n\n失败详情：\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...' : ''}`);
    }
  };

  const downloadTemplate = () => {
    const template = `title,content,is_vip,difficulty,collection_id,vip_level_required,sort
"什么是闭包?","闭包是指函数可以访问其词法作用域外的变量。

示例代码：
\`\`\`javascript
function outer() {
  let count = 0;
  return function inner() {
    count++;
    console.log(count);
  }
}
\`\`\`

**关键点**：
- 闭包可以访问外部函数的变量
- 常用于实现数据私有化",false,简单,,,1`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'interview_questions_template.csv';
    link.click();
  };

  // 权限检查中
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">验证权限中...</p>
        </div>
      </div>
    );
  }

  // 无权限访问
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              无权访问
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              抱歉，此页面仅限管理员访问。如果您认为这是一个错误，请联系系统管理员。
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                返回首页
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                返回上一页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* 页头 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            面试题批量导入
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            上传 CSV 文件批量导入面试题到指定题集
          </p>
        </div>

        {/* 操作区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-6">
            {/* 选择题集 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                选择目标题集 *
              </label>
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isLoading}
              >
                <option value="">请选择题集</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 上传文件 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                上传 CSV 文件 *
              </label>
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                  disabled={isLoading}
                />
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  下载模板
                </button>
              </div>
              {csvFile && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  已选择: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleParseCSV}
                disabled={!csvFile || !selectedCollectionId || isLoading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isLoading && parsedData.length === 0 ? '解析中...' : '解析 CSV'}
              </button>
              <button
                onClick={handleImport}
                disabled={parsedData.length === 0 || isLoading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isLoading && parsedData.length > 0 ? '导入中...' : '开始导入'}
              </button>
            </div>

            {/* 进度条 */}
            {uploadProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>导入进度</span>
                  <span>{uploadProgress.current} / {uploadProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* 提示信息 */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
              </div>
            )}
          </div>
        </div>

        {/* 预览区域 */}
        {parsedData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              数据预览 ({parsedData.length} 条)
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {parsedData.slice(0, 10).map((question, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {index + 1}. {question.title}
                    </h3>
                    <div className="flex gap-2">
                      {question.is_vip && (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                          VIP
                        </span>
                      )}
                      {question.difficulty && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          question.difficulty === '简单' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : question.difficulty === '中等'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                          {question.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {question.content.substring(0, 150)}...
                  </p>
                </div>
              ))}
              {parsedData.length > 10 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  还有 {parsedData.length - 10} 条数据未显示...
                </p>
              )}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
            📋 使用说明
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <li>• CSV 文件必须包含表头: title, content, is_vip, difficulty</li>
            <li>• is_vip 字段必须为 true 或 false</li>
            <li>• difficulty 推荐值: 简单、中等、困难</li>
            <li>• 可选字段: vip_level_required (1-5), sort (排序号)</li>
            <li>• 内容支持 Markdown 格式，包含逗号或换行时用双引号包裹</li>
            <li>• 建议先下载模板，参考格式填写数据</li>
          </ul>
        </div>

        {/* 题目管理列表 */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              题目管理
            </h2>
            <button
              onClick={loadQuestions}
              disabled={isLoadingQuestions}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
          </div>

          {/* 搜索和筛选 */}
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索题目标题..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={filterCollectionId}
              onChange={(e) => setFilterCollectionId(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">所有题集</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.title}
                </option>
              ))}
            </select>
          </div>

          {/* 题目列表 */}
          {isLoadingQuestions ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">暂无题目</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        标题
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        题集
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        难度
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        VIP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        排序
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedQuestions.map((question) => (
                      <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                            {question.title}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getCollectionName(question.collection_id)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {question.difficulty && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              question.difficulty === '简单' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                : question.difficulty === '中等'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            }`}>
                              {question.difficulty}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {question.is_vip ? (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                              VIP{question.vip_level_required ? ` L${question.vip_level_required}` : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {question.sort || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {new Date(question.created_at).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    共 {questions.length} 条题目，第 {currentPage} / {totalPages} 页
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 编辑模态框 */}
        {showEditModal && editingQuestion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    编辑题目
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 标题 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      标题 *
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.title}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* 内容 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      答案内容 * (支持 Markdown)
                    </label>
                    <textarea
                      value={editingQuestion.content || ''}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                      rows={15}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                  </div>

                  {/* 难度和VIP设置 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        难度
                      </label>
                      <select
                        value={editingQuestion.difficulty || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">不设置</option>
                        <option value="简单">简单</option>
                        <option value="中等">中等</option>
                        <option value="困难">困难</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        排序号
                      </label>
                      <input
                        type="number"
                        value={editingQuestion.sort || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, sort: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* VIP设置 */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingQuestion.is_vip || false}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, is_vip: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">VIP 专属</span>
                    </label>

                    {editingQuestion.is_vip && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">VIP 等级:</label>
                        <select
                          value={editingQuestion.vip_level_required || ''}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, vip_level_required: e.target.value ? parseInt(e.target.value) : null })}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">不限</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* 按钮 */}
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

