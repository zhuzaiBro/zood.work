export type JobListing = {
  id: string;
  title: string | null;
  company_name: string | null;
  company_logo: string | null;
  location: string | null;
  office_mode_name: string | null;
  work_type_name: string | null;
  min_salary: number | null;
  max_salary: number | null;
  salary_currency?: string | null;
  pay_period?: string | null;
  source_created_at: string | null;
  last_synced_at: string;
  description: string | null;
  tags: unknown;
};

export function jobTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names = value.map(tag => typeof tag === 'string' ? tag : tag?.tagName);
  return [...new Set(names.filter((name): name is string => typeof name === 'string').map(name => name.trim()).filter(Boolean))];
}

const units: Record<string, string> = { per_month: '月', per_year: '年', per_hour: '小时', per_day: '天', per_week: '周', per_project: '项目' };
const amounts = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });

export function jobSalary(job: Pick<JobListing, 'min_salary' | 'max_salary' | 'salary_currency' | 'pay_period'>) {
  const min = job.min_salary, max = job.max_salary;
  if (!min && !max) return '薪资面议';
  let range = '';
  if (min && max) range = min === max ? amounts.format(min) : `${amounts.format(min)}–${amounts.format(max)}`;
  else if (min) range = `${amounts.format(min)} 起`;
  else if (max) range = `最高 ${amounts.format(max)}`;
  const currency = job.salary_currency ? ` ${job.salary_currency}` : '';
  const unit = units[job.pay_period || ''];
  return range + currency + (unit ? ` / ${unit}` : '');
}

const dates = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
export function jobDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ? dates.format(date) : '';
}
