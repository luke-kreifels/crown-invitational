import { useState } from "react";
import initialBracket from "../bracketData";
import { database, ref, push, set } from '../firebase'; 
import Match from "./Match";
import Leaderboard from "./leaderboard";
import "./Bracket.css";

const Bracket = () => {
  const [bracket, setBracket] = useState(initialBracket);
  const [champion, setChampion] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const selectWinner = (round, matchId, team) => {
    setBracket((prev) => {
      const updatedBracket = { ...prev };
  
      // Helper function to reset subsequent rounds only for matches where the specific team was previously a winner
      const resetSubsequentRounds = (startRound, startMatchId, team) => {
        const roundOrder = ["round1", "round2", "semifinals", "finals"];
        const currentRoundIndex = roundOrder.indexOf(startRound);
        
        // Reset all subsequent rounds
        for (let i = currentRoundIndex + 1; i < roundOrder.length; i++) {
          const currentRound = roundOrder[i];
          
          // Determine which bracket side the match is on
          const isLeftSide = startMatchId <= 10;
          const bracketSide = isLeftSide ? "left" : "right";
          
          if (currentRound === "finals") {
            // Only reset finals if the team was previously in the finals
            if (updatedBracket.finals[0].teamA === team || updatedBracket.finals[0].teamB === team) {
              updatedBracket.finals[0] = {
                ...updatedBracket.finals[0],
                teamA: updatedBracket.finals[0].teamA === team ? null : updatedBracket.finals[0].teamA,
                teamALogo: updatedBracket.finals[0].teamA === team ? null : updatedBracket.finals[0].teamALogo,
                teamB: updatedBracket.finals[0].teamB === team ? null : updatedBracket.finals[0].teamB,
                teamBLogo: updatedBracket.finals[0].teamB === team ? null : updatedBracket.finals[0].teamBLogo,
                winner: null
              };
              setChampion(null);
            }
          } else {
            // Reset specific rounds based on bracket side
            const matchesToReset = updatedBracket[bracketSide][currentRound].map(match => {
              // Check if this team was present in any advancing match in previous rounds
              const shouldResetTeamA = match.teamA === team;
              const shouldResetTeamB = match.teamB === team;
              
              return {
                ...match,
                teamA: shouldResetTeamA ? null : match.teamA,
                teamALogo: shouldResetTeamA ? null : match.teamALogo,
                teamB: shouldResetTeamB ? null : match.teamB,
                teamBLogo: shouldResetTeamB ? null : match.teamBLogo,
                winner: (shouldResetTeamA || shouldResetTeamB) ? null : match.winner
              };
            });
            
            updatedBracket[bracketSide][currentRound] = matchesToReset;
          }
        }
      };
  
      // Helper function to update a match with a winner
      const updateMatchWinner = (matches, matchId, winner) => {
        return matches.map((match) =>
          match.id === matchId ? { ...match, winner: winner } : match
        );
      };
  
      // Helper function to find the complete team object (with logo)
      const findTeamWithLogo = (round, team) => {
        const allRoundMatches = [
          ...(updatedBracket.left[round] || []),
          ...(updatedBracket.right[round] || [])
        ];
        
        const matchWithTeam = allRoundMatches.find(
          match => match.teamA === team || match.teamB === team
        );
        
        return {
          teamName: team,
          teamLogo: matchWithTeam?.teamA === team ? matchWithTeam.teamALogo : 
                    matchWithTeam?.teamB === team ? matchWithTeam.teamBLogo : null
        };
      };
  
      // Determine the side of the bracket
      const roundMatches = [
        ...(updatedBracket.left[round] || []),
        ...(updatedBracket.right[round] || [])
      ];
      const currentMatch = roundMatches.find(m => m.id === matchId);
  
      // Reset subsequent rounds if the team was previously a winner
      if (currentMatch && currentMatch.winner !== null) {
        resetSubsequentRounds(round, matchId, currentMatch.winner);
      }
  
      // Proceed with normal winner selection
      if (updatedBracket.left[round] && Array.isArray(updatedBracket.left[round])) {
        updatedBracket.left[round] = updateMatchWinner(updatedBracket.left[round], matchId, team);
      }
      if (updatedBracket.right[round] && Array.isArray(updatedBracket.right[round])) {
        updatedBracket.right[round] = updateMatchWinner(updatedBracket.right[round], matchId, team);
      }
      if (round === "finals") {
        updatedBracket.finals = updateMatchWinner(updatedBracket.finals, matchId, team);
        
        if (updatedBracket.finals[0].winner) {
          setChampion(updatedBracket.finals[0].winner);
        }
      }
  
      // Find the match that was just updated
      const match = [
        ...(updatedBracket.left[round] || []),
        ...(updatedBracket.right[round] || []),
      ].find((m) => m.id === matchId);
  
      if (match?.nextMatch) {
        const nextMatchId = match.nextMatch;
        const isLeftSide = nextMatchId <= 10;
        const isRightSide = nextMatchId > 10 && nextMatchId <= 14;
  
        const winnerWithLogo = findTeamWithLogo(round, team);
  
        if (isLeftSide && updatedBracket.left["round2"]) {
          updatedBracket.left["round2"] = updatedBracket.left["round2"].map((m) =>
            m.id === nextMatchId
              ? { 
                  ...m, 
                  teamA: m.teamA === null ? winnerWithLogo.teamName : m.teamA,
                  teamALogo: m.teamALogo === null ? winnerWithLogo.teamLogo : m.teamALogo
                }
              : m
          );
        } else if (isRightSide && updatedBracket.right["round2"]) {
          updatedBracket.right["round2"] = updatedBracket.right["round2"].map((m) =>
            m.id === nextMatchId
              ? { 
                  ...m, 
                  teamA: m.teamA === null ? winnerWithLogo.teamName : m.teamA,
                  teamALogo: m.teamALogo === null ? winnerWithLogo.teamLogo : m.teamALogo
                }
              : m
          );
        }
      }
  
      // Comprehensive reset and update of subsequent rounds
      const round1Matches = [
        ...(updatedBracket.left["round1"] || []),
        ...(updatedBracket.right["round1"] || []),
      ];
  
      if (updatedBracket.left["round2"] && updatedBracket.right["round2"]) {
        updatedBracket.left["round2"][0] = {
          ...updatedBracket.left["round2"][0],
          teamA: round1Matches[0]?.winner || null,
          teamALogo: round1Matches[0]?.winner ? findTeamWithLogo("round1", round1Matches[0].winner).teamLogo : null,
          teamB: round1Matches[1]?.winner || null,
          teamBLogo: round1Matches[1]?.winner ? findTeamWithLogo("round1", round1Matches[1].winner).teamLogo : null,
        };
        updatedBracket.left["round2"][1] = {
          ...updatedBracket.left["round2"][1],
          teamA: round1Matches[2]?.winner || null,
          teamALogo: round1Matches[2]?.winner ? findTeamWithLogo("round1", round1Matches[2].winner).teamLogo : null,
          teamB: round1Matches[3]?.winner || null,
          teamBLogo: round1Matches[3]?.winner ? findTeamWithLogo("round1", round1Matches[3].winner).teamLogo : null,
        };
        updatedBracket.right["round2"][0] = {
          ...updatedBracket.right["round2"][0],
          teamA: round1Matches[4]?.winner || null,
          teamALogo: round1Matches[4]?.winner ? findTeamWithLogo("round1", round1Matches[4].winner).teamLogo : null,
          teamB: round1Matches[5]?.winner || null,
          teamBLogo: round1Matches[5]?.winner ? findTeamWithLogo("round1", round1Matches[5].winner).teamLogo : null,
        };
        updatedBracket.right["round2"][1] = {
          ...updatedBracket.right["round2"][1],
          teamA: round1Matches[6]?.winner || null,
          teamALogo: round1Matches[6]?.winner ? findTeamWithLogo("round1", round1Matches[6].winner).teamLogo : null,
          teamB: round1Matches[7]?.winner || null,
          teamBLogo: round1Matches[7]?.winner ? findTeamWithLogo("round1", round1Matches[7].winner).teamLogo : null,
        };
      }
  
      // Populate semifinals with logos
      const round2Matches = [
        ...(updatedBracket.left["round2"] || []),
        ...(updatedBracket.right["round2"] || []),
      ];
  
      if (updatedBracket.left["semifinals"] && updatedBracket.right["semifinals"]) {
        updatedBracket.left["semifinals"][0] = {
          ...updatedBracket.left["semifinals"][0],
          teamA: round2Matches[0]?.winner || null,
          teamALogo: round2Matches[0]?.winner ? findTeamWithLogo("round2", round2Matches[0].winner).teamLogo : null,
          teamB: round2Matches[1]?.winner || null,
          teamBLogo: round2Matches[1]?.winner ? findTeamWithLogo("round2", round2Matches[1].winner).teamLogo : null,
        };
        updatedBracket.right["semifinals"][0] = {
          ...updatedBracket.right["semifinals"][0],
          teamA: round2Matches[2]?.winner || null,
          teamALogo: round2Matches[2]?.winner ? findTeamWithLogo("round2", round2Matches[2].winner).teamLogo : null,
          teamB: round2Matches[3]?.winner || null,
          teamBLogo: round2Matches[3]?.winner ? findTeamWithLogo("round2", round2Matches[3].winner).teamLogo : null,
        };
      }
  
      // Populate finals with semifinal winners and their logos
      const semifinalWinners = [
        updatedBracket.left["semifinals"]?.[0]?.winner || null,
        updatedBracket.right["semifinals"]?.[0]?.winner || null,
      ];
  
      if (updatedBracket.finals) {
        updatedBracket.finals[0] = {
          ...updatedBracket.finals[0],
          teamA: semifinalWinners[0],
          teamALogo: semifinalWinners[0] ? findTeamWithLogo("semifinals", semifinalWinners[0]).teamLogo : null,
          teamB: semifinalWinners[1],
          teamBLogo: semifinalWinners[1] ? findTeamWithLogo("semifinals", semifinalWinners[1]).teamLogo : null,
        };
      }
  
      // If the final match has a winner, set the champion
      if (round === "finals" && matchId === 15 && updatedBracket.finals[0]?.winner) {
        setChampion(updatedBracket.finals[0].winner);
      }
  
      return updatedBracket;
    });
  };



  const openSubmissionPopup = () => {
    setIsPopupOpen(true);
  };

  const closeSubmissionPopup = () => {
    setIsPopupOpen(false);
    setUserName('');
  };

  const handleSubmit = async () => {
    if (!userName.trim()) {
      alert('Please enter a name for your picks');
      return;
    }

    if (!champion) {
      alert('Please complete your tournament bracket');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create a reference to a new entry in the 'brackets' node
      const bracketsRef = ref(database, 'brackets');
      const newBracketRef = push(bracketsRef);

      // Prepare the data to submit
      const submissionData = {
        userName: userName.trim(),
        champion: champion,
        bracketData: {
          left: bracket.left,
          right: bracket.right,
          finals: bracket.finals
        },
        submittedAt: new Date().toISOString()
      };

      // Write the data to the database
      await set(newBracketRef, submissionData);

      alert('Bracket submitted successfully!');
      setIsSubmitting(false);
      closeSubmissionPopup();
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit bracket. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Function to get winners from each round
  const getWinners = () => {
    const winners = [];

    // Collect winners from Round 1
    [...bracket.left.round1, ...bracket.right.round1].forEach(match => {
      if (match.winner) {
        winners.push({ round: 'Round 1', winner: match.winner });
      }
    });

    // Collect winners from Round 2
    [...bracket.left.round2, ...bracket.right.round2].forEach(match => {
      if (match.winner) {
        winners.push({ round: 'Round 2', winner: match.winner });
      }
    });

    // Collect winners from Semifinals
    [...bracket.left.semifinals, ...bracket.right.semifinals].forEach(match => {
      if (match.winner) {
        winners.push({ round: 'Semifinals', winner: match.winner });
      }
    });

    // Add Finals winner
    if (bracket.finals[0].winner) {
      winners.push({ round: 'Finals', winner: bracket.finals[0].winner });
    }

    return winners;
  };
  const openLeaderboard = () => {
    setIsLeaderboardOpen(true);
  };

  const closeLeaderboard = () => {
    setIsLeaderboardOpen(false);
  };

  
    return (
    <div className="app-container">
      <div className="tournament-header">
        <button 
            onClick={openLeaderboard} 
            className="leaderboard-button"
          >
            Leaderboard
        </button>
        <div className="tournament-title">Crown Invitational</div>
        <button 
          onClick={openSubmissionPopup} 
          className="submit-bracket-button"
        >
          Submit Bracket
        </button>
      </div>
      
      {/* Leaderboard Popup */}
      {isLeaderboardOpen && (
        <div className="popup-overlay">
          <div className="popup-content leaderboard-popup">
            <Leaderboard onClose={closeLeaderboard} />
          </div>
        </div>
      )}

      {/* Submission Popup */}
      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-popup" onClick={closeSubmissionPopup}>×</button>
            <h2>Your Tournament Picks</h2>
            <div className="submission-section">
              <input 
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="name-input"
              />
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="final-submit-button"
              >
                {isSubmitting ? 'Submitting...' : 'Submit My Picks'}
              </button>
            </div>
            <div className="winners-list">
              <h3>Winners by Round</h3>
              {getWinners().map((match, index) => (
                <div key={index} className="winner-row">
                  <span className="winner-round">{match.round}:</span>
                  <span className="winner-team">{match.winner}</span>
                </div>
              ))}
            </div>

            {champion && (
              <div className="champion-confirmation">
                <h3>Tournament Champion</h3>
                <p>{champion}</p>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="bracket-container">
        {/* Left Side */}
        <div className="round-container">
          <h2>Round 1</h2>
          {bracket.left.round1.map((match) => (
            <Match key={match.id} match={match} round="round1" onSelectWinner={selectWinner} />
          ))}
        </div>

        <div className="round-container">
          <h2>Round 2</h2>
          {bracket.left.round2.map((match) => (
            <Match key={match.id} match={match} round="round2" onSelectWinner={selectWinner} />
          ))}
        </div>

        <div className="round-container">
          <h2>Semifinal</h2>
          {bracket.left.semifinals.map((match) => (
            <Match key={match.id} match={match} round="semifinals" onSelectWinner={selectWinner} />
          ))}
        </div>

        {/* Finals (Center) */}
        <div className="round-container finals">
          <h2>Final</h2>
          {bracket.finals.map((match) => (
            <Match key={match.id} match={match} round="finals" onSelectWinner={selectWinner} />
          ))}

          {/* Champion Box (Now Below the Final Match) */}
          <div className="champion-box">
            <h2>Champion: {champion || "TBD"}</h2>
          </div>
        </div>

        {/* Right Side */}
        <div className="round-container">
          <h2>Semifinal</h2>
          {bracket.right.semifinals.map((match) => (
            <Match key={match.id} match={match} round="semifinals" onSelectWinner={selectWinner} />
          ))}
        </div>

        <div className="round-container">
          <h2>Round 2</h2>
          {bracket.right.round2.map((match) => (
            <Match key={match.id} match={match} round="round2" onSelectWinner={selectWinner} />
          ))}
        </div>

        <div className="round-container">
          <h2>Round 1</h2>
          {bracket.right.round1.map((match) => (
            <Match key={match.id} match={match} round="round1" onSelectWinner={selectWinner} />
          ))}
        </div>
      </div>
    </div>
    
  );
};

export default Bracket;