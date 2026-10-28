import React from "react";
import SplittingText from "./SplittingText";

const SplittingWrapperWord = ({ children }) => {
  const wrapWord = children.split(/(\s+)/);
  return (
    <>
      {wrapWord.map((word, index) => {
        return (
          <span className="wrapper-word" key={index}>
            <SplittingText>{word}</SplittingText>
          </span>
        );
      })}
    </>
  );
};

export default SplittingWrapperWord;
