const Match = ({ match, round, onSelectWinner }) => {
  return (
    <div className="match">
      <button 
        onClick={() => onSelectWinner(round, match.id, match.teamA)}
        style={{
          backgroundColor: match.teamA && match.winner === match.teamA ? 'green' : 
                           match.teamA && match.winner && match.winner !== match.teamA ? 'red' : 'white',
          color: (match.teamA && match.winner === match.teamA) || (match.teamA && match.winner && match.winner !== match.teamA) ? 'white' : 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          padding: '8px'
        }}
      >
        {match.teamALogo && (
          <img 
            src={match.teamALogo} 
            alt={`${match.teamA} logo`} 
            style={{ 
              width: '20px', 
              height: '20px', 
              marginRight: '5px' 
            }} 
          />
        )}
        {match.teamA || '-'}
      </button>
      <span> vs </span>
      <button 
        onClick={() => onSelectWinner(round, match.id, match.teamB)}
        style={{
          backgroundColor: match.teamB && match.winner === match.teamB ? 'green' : 
                           match.teamB && match.winner && match.winner !== match.teamB ? 'red' : 'white',
          color: (match.teamB && match.winner === match.teamB) || (match.teamB && match.winner && match.winner !== match.teamB) ? 'white' : 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          padding: '8px'
        }}
      >
        {match.teamBLogo && (
          <img 
            src={match.teamBLogo} 
            alt={`${match.teamB} logo`} 
            style={{ 
              width: '20px', 
              height: '20px', 
              marginRight: '5px' 
            }} 
          />
        )}
        {match.teamB || '-'}
      </button>
    </div>
  );
};

export default Match;