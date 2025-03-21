const Footer = () => {
  return (
    <footer className="bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center text-white">
          <p>
            &copy; {new Date().getFullYear()} AI Shorts Generator. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;