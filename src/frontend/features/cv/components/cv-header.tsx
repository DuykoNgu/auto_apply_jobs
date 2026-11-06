type Props = { title?: string; description?: string };

const DEFAULT_DESCRIPTION = 'CV gốc không bao giờ bị ghi đè. Mỗi job có một bản tối ưu riêng, tạo từ đây.';

export function CvHeader({ title = 'CV gốc của bạn', description = DEFAULT_DESCRIPTION }: Props) {
  return (
    <header className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
      <h1 data-h1 className="text-[28px] leading-tight font-light tracking-[-.02em] focus:outline-none">
        {title}
      </h1>
      <p className="text-14 text-ink-3">{description}</p>
    </header>
  );
}
