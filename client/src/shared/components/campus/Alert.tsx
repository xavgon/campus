interface AlertProps {
  title: string;
  message: string;
}

export const Alert = ({ title, message }: AlertProps) => (
  <div
    className="rounded-none border border-campus-danger/40 bg-campus-danger-soft px-4 py-3 text-sm"
    role="alert"
  >
    <p className="font-semibold text-campus-danger">{title}</p>
    <p className="mt-1 text-red-100/90">{message}</p>
  </div>
);
