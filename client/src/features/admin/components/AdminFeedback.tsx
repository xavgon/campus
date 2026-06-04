interface AdminFeedbackProps {
  notice?: string | null;
  error?: string | null;
}

export const AdminFeedback = ({ notice, error }: AdminFeedbackProps) => (
  <>
    {notice && (
      <p className="mb-4 rounded-none border border-campus-primary/30 bg-campus-primary/10 px-4 py-3 text-sm text-campus-primary">
        {notice}
      </p>
    )}
    {error && (
      <p className="mb-4 rounded-none border border-campus-danger/40 bg-campus-danger/10 px-4 py-3 text-sm text-campus-danger">
        {error}
      </p>
    )}
  </>
);
