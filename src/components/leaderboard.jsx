import React, { useState, useEffect } from 'react';
import { database, ref, onValue } from '../firebase'; // Adjust path as needed

const Leaderboard = ({ onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const correctWinners = {
    round1: ["winner1", "winner2", "winner3", "winner4", "winner5", "winner6", "winner7", "winner8"],
    round2: ["winner1", "winner2", "winner3", "winner4"],
    semifinals: ["winner1", "winner2"],
    finals: ["champ"]
  };

  const calculateScore = (userBracket) => {
    let score = 0;
    const pointValues = { round1: 10, round2: 20, semifinals: 40, finals: 80 };
  
    Object.keys(pointValues).forEach((round) => {
      const correctTeams = correctWinners[round] || [];
  
      const userWinners = [
        ...(userBracket.left?.[round]?.map((match) => match.winner) || []),
        ...(userBracket.right?.[round]?.map((match) => match.winner) || []),
        ...(round === "finals" ? userBracket.finals?.map((match) => match.winner) || [] : []),
      ];

      userWinners.forEach((winner) => {
        if (winner && correctTeams.includes(winner)) {
          score += pointValues[round];
        }
      });
    });
  
    return score;
  };
  

  useEffect(() => {
    const bracketsRef = ref(database, "brackets");
  
    const unsubscribe = onValue(
      bracketsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const submissionsList = Object.entries(data)
            .map(([id, submission]) => ({
              id,
              ...submission,
              points: calculateScore(submission.bracketData)
            }))
            .sort((a, b) => b.points - a.points);
  
          setSubmissions(submissionsList);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching submissions:", error);
        setIsLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, []);

  const renderBracketDetails = (bracketData) => {
    const rounds = [
      { key: 'round1', title: 'Round 1' },
      { key: 'round2', title: 'Round 2' },
      { key: 'semifinals', title: 'Semifinals' },
      { key: 'finals', title: 'Finals' }
    ];

    return (
      <div className="detailed-bracket">
        {rounds.map((round) => {
          const leftMatches = bracketData.left[round.key] || [];
          const rightMatches = bracketData.right[round.key] || [];
          const isFinalsRound = round.key === 'finals';

          return (
            <div key={round.key} className="detailed-round">
              <h3>{round.title}</h3>
              {isFinalsRound ? (
                <div className="finals-match">
                  <div className="team">
                    {bracketData.finals[0].teamA} 
                    {bracketData.finals[0].winner === bracketData.finals[0].teamA && ' (Winner)'}
                  </div>
                  <div className="team">
                    {bracketData.finals[0].teamB}
                    {bracketData.finals[0].winner === bracketData.finals[0].teamB && ' (Winner)'}
                  </div>
                </div>
              ) : (
                <div className="matches-container">
                  <div className="left-side">
                    {leftMatches.map((match, index) => (
                      <div key={index} className="match">
                        <div className="team">
                          {match.teamA}
                          {match.winner === match.teamA && ' (Winner)'}
                        </div>
                        <div className="team">
                          {match.teamB}
                          {match.winner === match.teamB && ' (Winner)'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="right-side">
                    {rightMatches.map((match, index) => (
                      <div key={index} className="match">
                        <div className="team">
                          {match.teamA}
                          {match.winner === match.teamA && ' (Winner)'}
                        </div>
                        <div className="team">
                          {match.teamB}
                          {match.winner === match.teamB && ' (Winner)'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading submissions...</div>;
  }

  return (
    <div className="leaderboard-container">
      <button className="close-popup" onClick={onClose}>×</button>
      <h1>Leaderboard</h1>

      {/* Scoring Section */}
      <div className="scoring-info">
        <span>Scoring</span>
        <span 
          className="info-icon"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          ℹ️
        </span>
        {showTooltip && (
          <div className="tooltip">
            <p>Round 1: 10 Points</p>
            <p>Round 2: 20 Points</p>
            <p>Semifinals: 40 Points</p>
            <p>Final: 80 Points</p>
          </div>
        )}
      </div>

      {selectedSubmission ? (
        <div className="detailed-view">
          <button 
            className="back-to-leaderboard" 
            onClick={() => setSelectedSubmission(null)}
          >
            ← Back to Leaderboard
          </button>
          <h2>{selectedSubmission.userName}'s Bracket</h2>
          <div className="submission-details">
            <p>Champion Pick: {selectedSubmission.champion}</p>
            <p>Submitted At: {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
          </div>
          {renderBracketDetails(selectedSubmission.bracketData)}
        </div>
      ) : (
        submissions.length === 0 ? (
          <p>No submissions yet</p>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Champion</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr 
                  key={submission.id} 
                  onClick={() => setSelectedSubmission(submission)}
                  className="clickable-row"
                >
                  <td style={{ textDecoration: "underline" }}>{submission.userName}</td>
                  <td>{submission.champion}</td>
                  <td>{submission.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
};

export default Leaderboard;
