interface SuccessNoticeProps {
  title: string;
  message: string;
}

export const SuccessNotice = ({ title, message }: SuccessNoticeProps) => (
  <div
    className="rounded-none border border-campus-primary/30 bg-campus-primary/10 px-4 py-3 text-sm"
    role="status"
  >
    <p className="font-semibold text-campus-primary">{title}</p>
    <p className="mt-1 text-campus-accent">{message}</p>
  </div>
);
