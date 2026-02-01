export const tools = {
  recommendSongs: ({ mood }) => {
    const map = {
      romantic: ["Perfect - Ed Sheeran", "Raabta - Arijit Singh", "Tum Hi Ho"],
      sad: ["Fix You - Coldplay", "Let Her Go - Passenger"],
      happy: ["Happy - Pharrell Williams", "Can't Stop the Feeling"],
    };

    return {
      mood,
      songs: map[mood] || ["Believer - Imagine Dragons"],
    };
  },
};
