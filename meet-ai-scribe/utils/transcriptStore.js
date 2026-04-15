let transcript = [];

exports.addLine = (line) => {
  transcript.push(line);
};

exports.getTranscript = () => {
  return transcript.join(" ");
};

exports.clearTranscript = () => {
  transcript = [];
};