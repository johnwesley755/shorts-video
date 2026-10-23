// src/pages/Create.tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export const Create = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt) {
      navigate(`/?prompt=${encodeURIComponent(prompt)}#studio`, { replace: true });
    } else {
      navigate("/#studio", { replace: true });
    }
  }, [navigate, searchParams]);

  return null;
};

export default Create;
