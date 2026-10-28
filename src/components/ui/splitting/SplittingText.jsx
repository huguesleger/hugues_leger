import React from "react";

const SplittingText = ({ children }) => {
  const word = children.split("");

  return (
    <>
      {word.map((char, index) => {
        return (
          <span className="char" key={index}>
            {char}
          </span>
        );
      })}
    </>
  );
};

export default SplittingText;
