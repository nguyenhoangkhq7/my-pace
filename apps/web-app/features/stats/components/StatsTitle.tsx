interface StatsTitleProps {
  title?: string;
  subtitle?: string;
}

export function StatsTitle({
  title = "Progress Analytics",
  subtitle = "Nhìn lại thời gian và tiến độ hoàn thành công việc của bạn.",
}: StatsTitleProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1.5">
        {title}
      </h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}
