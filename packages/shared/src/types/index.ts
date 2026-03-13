// ─── Platform Constants ───────────────────────────────────────────────────────

export const DISTRIBUTION_PLATFORMS = [
  { id: 'spotify',       name: 'Spotify',              color: '#1DB954' },
  { id: 'apple_music',   name: 'Apple Music',          color: '#FC3C44' },
  { id: 'youtube_music', name: 'YouTube Music',        color: '#FF0000' },
  { id: 'tiktok',        name: 'TikTok',               color: '#69C9D0' },
  { id: 'amazon_music',  name: 'Amazon Music',         color: '#00A8E1' },
  { id: 'deezer',        name: 'Deezer',               color: '#A238FF' },
  { id: 'tidal',         name: 'Tidal',                color: '#00FFFF' },
  { id: 'soundcloud',    name: 'SoundCloud',           color: '#FF5500' },
  { id: 'pandora',       name: 'Pandora',              color: '#3668FF' },
  { id: 'instagram',     name: 'Instagram / Facebook', color: '#E1306C' },
  { id: 'vevo',          name: 'Vevo',                 color: '#FF0000' },
  { id: 'napster',       name: 'Napster',              color: '#1DA0C3' },
  { id: 'qobuz',         name: 'Qobuz',                color: '#1F1F4B' },
  { id: 'anghami',       name: 'Anghami',              color: '#5C0E8B' },
] as const;

export const GENRES = [
  'Afrobeats', 'Alternative', 'Ambient', 'Blues', 'Classical', 'Country',
  'Dance / Electronic', 'Dancehall', 'Folk', 'Gospel', 'Hip-Hop / Rap',
  'House', 'Indie', 'Jazz', 'K-Pop', 'Latin', 'Metal', 'Neo Soul', 'Pop',
  'Punk', 'R&B / Soul', 'Reggae', 'Reggaeton', 'Rock', 'Sinhala Pop',
  'Sinhala Traditional', 'Soundtrack', 'Techno', 'Trap', 'World Music',
] as const;

export const SUBGENRES: Record<string, string[]> = {
  'Hip-Hop / Rap':   ['Trap', 'Drill', 'Boom Bap', 'Cloud Rap', 'Conscious Hip-Hop', 'Mumble Rap'],
  'Pop':             ['Synthpop', 'Indie Pop', 'Art Pop', 'Chamber Pop', 'Electropop', 'K-Pop', 'J-Pop'],
  'R&B / Soul':      ['Contemporary R&B', 'Neo Soul', 'Quiet Storm', 'Funk', 'Gospel'],
  'Dance / Electronic': ['House', 'Techno', 'Drum and Bass', 'Dubstep', 'Trance', 'Ambient', 'IDM'],
  'Rock':            ['Alternative Rock', 'Indie Rock', 'Hard Rock', 'Punk Rock', 'Post-Rock', 'Grunge'],
  'Classical':       ['Baroque', 'Romantic', 'Contemporary Classical', 'Choral', 'Opera', 'Chamber Music'],
  'Latin':           ['Reggaeton', 'Salsa', 'Bachata', 'Latin Pop', 'Cumbia', 'Bossa Nova'],
  'Metal':           ['Heavy Metal', 'Death Metal', 'Black Metal', 'Doom Metal', 'Nu Metal', 'Thrash'],
  'Country':         ['Traditional Country', 'Country Pop', 'Americana', 'Bluegrass', 'Country Rock'],
  'Jazz':            ['Contemporary Jazz', 'Bebop', 'Smooth Jazz', 'Fusion', 'Free Jazz'],
};

export const LANGUAGES = [
  'Afrikaans', 'Arabic', 'Bengali', 'Cantonese', 'Dutch', 'English',
  'French', 'German', 'Hindi', 'Indonesian', 'Instrumental', 'Italian',
  'Japanese', 'Korean', 'Mandarin', 'Malay', 'Polish', 'Portuguese',
  'Russian', 'Sinhala', 'Spanish', 'Swahili', 'Tamil', 'Thai',
  'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese',
] as const;

export const RELEASE_TYPES = ['single', 'ep', 'album', 'compilation', 'soundtrack', 'live'] as const;
export const RELEASE_STATUSES = ['draft', 'pending', 'processing', 'approved', 'rejected', 'distributed', 'takedown'] as const;

// ─── Artist Roles ─────────────────────────────────────────────────────────────
export const ARTIST_ROLES = [
  { id: 'primary_artist',    label: 'Primary Artist',   ddex: 'MainArtist' },
  { id: 'featuring',         label: 'Featuring',        ddex: 'FeaturedArtist' },
  { id: 'remixer',           label: 'Remixer',          ddex: 'Remixer' },
  { id: 'composer',          label: 'Composer',         ddex: 'Composer' },
  { id: 'lyricist',          label: 'Lyricist',         ddex: 'Lyricist' },
  { id: 'producer',          label: 'Producer',         ddex: 'MusicProducer' },
  { id: 'band',              label: 'Band',             ddex: 'Band' },
  { id: 'orchestra',         label: 'Orchestra',        ddex: 'Orchestra' },
  { id: 'conductor',         label: 'Conductor',        ddex: 'Conductor' },
  { id: 'arranger',          label: 'Arranger',         ddex: 'Arranger' },
] as const;

// ─── Contributor / Recording Credit Roles ─────────────────────────────────────
export const CONTRIBUTOR_ROLES = [
  { id: 'mixer',               label: 'Mixer',               category: 'Engineering', ddex: 'MixingEngineer' },
  { id: 'mastering_engineer',  label: 'Mastering Engineer',  category: 'Engineering', ddex: 'MasteringEngineer' },
  { id: 'recording_engineer',  label: 'Recording Engineer',  category: 'Engineering', ddex: 'RecordingEngineer' },
  { id: 'producer',            label: 'Producer',            category: 'Production',  ddex: 'MusicProducer' },
  { id: 'co_producer',         label: 'Co-Producer',         category: 'Production',  ddex: 'AssociatedPerformer' },
  { id: 'executive_producer',  label: 'Executive Producer',  category: 'Production',  ddex: 'AssociatedPerformer' },
  { id: 'programmer',          label: 'Programmer',          category: 'Production',  ddex: 'Programmer' },
  { id: 'composer',            label: 'Composer',            category: 'Writing',     ddex: 'Composer' },
  { id: 'lyricist',            label: 'Lyricist',            category: 'Writing',     ddex: 'Lyricist' },
  { id: 'arranger',            label: 'Arranger',            category: 'Writing',     ddex: 'Arranger' },
  { id: 'vocalist',            label: 'Vocalist',            category: 'Performance', ddex: 'AssociatedPerformer' },
  { id: 'background_vocals',   label: 'Background Vocals',   category: 'Performance', ddex: 'BackgroundVocalist' },
  { id: 'guitarist',           label: 'Guitarist',           category: 'Instrument',  ddex: 'AssociatedPerformer' },
  { id: 'bassist',             label: 'Bassist',             category: 'Instrument',  ddex: 'AssociatedPerformer' },
  { id: 'drummer',             label: 'Drummer',             category: 'Instrument',  ddex: 'AssociatedPerformer' },
  { id: 'pianist',             label: 'Pianist',             category: 'Instrument',  ddex: 'AssociatedPerformer' },
  { id: 'keyboardist',         label: 'Keyboardist',         category: 'Instrument',  ddex: 'AssociatedPerformer' },
  { id: 'violinist',           label: 'Violinist',           category: 'Instrument',  ddex: 'AssociatedPerformer' },
  { id: 'cellist',             label: 'Cellist',             category: 'Instrument',  ddex: 'AssociatedPerformer' },
  { id: 'horn',                label: 'Horn',                category: 'Instrument',  ddex: 'AssociatedPerformer' },
  { id: 'percussion',          label: 'Percussion',          category: 'Instrument',  ddex: 'AssociatedPerformer' },
  { id: 'dj',                  label: 'DJ',                  category: 'Performance', ddex: 'DJ' },
  { id: 'conductor',           label: 'Conductor',           category: 'Performance', ddex: 'Conductor' },
] as const;

export const PRO_AFFILIATIONS = [
  'ASCAP', 'BMI', 'SESAC', 'SOCAN', 'PRS', 'APRA', 'SIAE', 'SABAM',
  'GEMA', 'JASRAC', 'CASH', 'IMRO', 'SAMRO', 'ZAMP', 'AKM', 'OSA',
  'SPA', 'STIM', 'KODA', 'TEOSTO', 'TONO', 'NCB', 'CISAC', 'Other',
] as const;

export const TERRITORIES = [
  { id: 'worldwide',    name: 'Worldwide' },
  { id: 'AF',  name: 'Africa' },
  { id: 'AS',  name: 'Asia' },
  { id: 'EU',  name: 'Europe' },
  { id: 'NA',  name: 'North America' },
  { id: 'SA',  name: 'South America' },
  { id: 'OC',  name: 'Oceania' },
  { id: 'US',  name: 'United States' },
  { id: 'GB',  name: 'United Kingdom' },
  { id: 'DE',  name: 'Germany' },
  { id: 'FR',  name: 'France' },
  { id: 'JP',  name: 'Japan' },
  { id: 'KR',  name: 'South Korea' },
  { id: 'AU',  name: 'Australia' },
  { id: 'CA',  name: 'Canada' },
  { id: 'IN',  name: 'India' },
  { id: 'BR',  name: 'Brazil' },
  { id: 'MX',  name: 'Mexico' },
  { id: 'LK',  name: 'Sri Lanka' },
  { id: 'NG',  name: 'Nigeria' },
  { id: 'ZA',  name: 'South Africa' },
  { id: 'EG',  name: 'Egypt' },
  { id: 'SA_c',name: 'Saudi Arabia' },
  { id: 'AE',  name: 'UAE' },
] as const;

// ─── DDEX ERN 4.3 Constants ───────────────────────────────────────────────────
export const DDEX_ERN_VERSIONS = ['4.3', '4.2', '4.1'] as const;
export const DDEX_MESSAGE_TYPES = ['NewReleaseMessage', 'PurgeReleaseMessage', 'TakedownMessage', 'UpdateReleaseMessage'] as const;
export const DDEX_RELEASE_TYPES: Record<string, string> = {
  single: 'Single', ep: 'EP', album: 'Album',
  compilation: 'Compilation', soundtrack: 'Soundtrack', live: 'LiveAlbum',
};

// ─── TypeScript interfaces ─────────────────────────────────────────────────────

export interface ArtistCredit {
  id?: string;
  name: string;
  role: string;        // from ARTIST_ROLES
  artistId?: string;   // internal artist record
  isniCode?: string;
  spotifyId?: string;
  appleId?: string;
  sequenceNo?: number;
}

export interface ContributorCredit {
  id?: string;
  name: string;
  role: string;        // from CONTRIBUTOR_ROLES
  ipiNumber?: string;
  proAffiliation?: string;
  sequenceNo?: number;
}

export interface PublishingShare {
  id?: string;
  type: 'songwriter' | 'publisher';
  name: string;
  ipiNumber?: string;
  proAffiliation?: string;
  sharePercent: number;
}

export interface TrackMetadata {
  id?: string;
  title: string;
  titleVersion?: string;   // "Radio Edit", "Remix", etc.
  trackNumber: number;
  discNumber: number;
  isrc?: string;
  isExplicit: boolean;
  language?: string;
  audioUrl?: string;
  audioS3Key?: string;
  audioFormat?: string;
  durationSeconds?: number;
  audioSizeBytes?: number;
  audioBitrate?: number;
  audioSampleRate?: number;
  artists: ArtistCredit[];
  contributors: ContributorCredit[];
  publishing: PublishingShare[];
  previewStartSeconds?: number;
  lyricsLanguage?: string;
  lyrics?: string;
}

export interface ReleaseWizardData {
  // Step 1 – Release Info
  title: string;
  type: string;
  genre: string;
  subgenre?: string;
  language: string;
  labelName?: string;
  parentalAdvisory: 'none' | 'explicit' | 'cleaned';
  releaseDate?: string;
  originalReleaseDate?: string;
  territories: string[];
  upc?: string;

  // Step 2 – Release-level artists
  artists: ArtistCredit[];

  // Step 3 – Tracks
  tracks: TrackMetadata[];

  // Step 4 – Release-level contributors
  contributors: ContributorCredit[];

  // Step 5 – Publishing
  publishing: PublishingShare[];

  // Step 6 – Artwork
  artworkUrl?: string;
  artworkS3Key?: string;

  // Step 7 – Distribution
  distributionPlatforms: string[];
  scheduledReleaseTime?: string;

  // Step 8 – Notes
  submissionNotes?: string;
}
