import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Release } from '../releases/entities/release.entity';
import { Song } from '../releases/entities/song.entity';

@Injectable()
export class DdexService {
  private readonly logger = new Logger(DdexService.name);

  constructor(
    @InjectRepository(Release) private readonly releaseRepo: Repository<Release>,
    @InjectRepository(Song)    private readonly songRepo:    Repository<Song>,
  ) {}

  // ── Role mapping ────────────────────────────────────────────────────────────

  private readonly ARTIST_ROLE_MAP: Record<string, string> = {
    primary_artist:  'MainArtist',
    featuring:       'FeaturedArtist',
    remixer:         'Remixer',
    composer:        'Composer',
    lyricist:        'Lyricist',
    producer:        'MusicProducer',
    band:            'Band',
    orchestra:       'Orchestra',
    conductor:       'Conductor',
    arranger:        'Arranger',
  };

  private readonly CONTRIBUTOR_ROLE_MAP: Record<string, string> = {
    mixer:               'MixingEngineer',
    mastering_engineer:  'MasteringEngineer',
    recording_engineer:  'RecordingEngineer',
    producer:            'MusicProducer',
    co_producer:         'AssociatedPerformer',
    executive_producer:  'AssociatedPerformer',
    programmer:          'Programmer',
    composer:            'Composer',
    lyricist:            'Lyricist',
    arranger:            'Arranger',
    vocalist:            'AssociatedPerformer',
    background_vocals:   'BackgroundVocalist',
    guitarist:           'AssociatedPerformer',
    bassist:             'AssociatedPerformer',
    drummer:             'AssociatedPerformer',
    pianist:             'AssociatedPerformer',
    keyboardist:         'AssociatedPerformer',
    violinist:           'AssociatedPerformer',
    cellist:             'AssociatedPerformer',
    dj:                  'DJ',
    conductor:           'Conductor',
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private esc(s?: string): string {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  private isoDuration(s?: number): string {
    if (!s) return 'PT0S';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `PT${m}M${sec}S` : `PT${sec}S`;
  }

  private ddexDate(d?: Date | string): string {
    if (!d) return new Date().toISOString().split('T')[0];
    return new Date(d).toISOString().split('T')[0];
  }

  private artistRoleDdex(r: string): string {
    return this.ARTIST_ROLE_MAP[r] || 'AssociatedPerformer';
  }

  private contributorRoleDdex(r: string): string {
    return this.CONTRIBUTOR_ROLE_MAP[r] || 'AssociatedPerformer';
  }

  // ── Main XML generator ──────────────────────────────────────────────────────

  async generateNewReleaseMessage(releaseId: string, senderDpid = 'PADPIDA2024010101O', senderName = 'MREC Entertainment'): Promise<string> {
    const release = await this.releaseRepo.findOne({
      where: { id: releaseId },
      relations: ['songs', 'user'],
    });
    if (!release) throw new NotFoundException('Release not found');

    const songs = release.songs || [];
    const messageId = `${senderDpid}_${Date.now()}`;
    const now = new Date().toISOString();
    const releaseRef = 'R0';

    const releaseType: Record<string, string> = {
      single: 'Single', ep: 'EP', album: 'Album',
      compilation: 'Compilation', soundtrack: 'Soundtrack', live: 'LiveAlbum',
    };

    // Derive primary artist from artistCredits
    const primaryArtist = (release.artistCredits || []).find((a: any) => a.role === 'primary_artist');
    const primaryArtistName = primaryArtist?.name || (release as any).songs?.[0]?.artistName || 'Unknown Artist';

    // ── Build ResourceList (SoundRecordings + Image) ──────────────────────────
    const soundRecordings = songs.map((song, idx) => {
      const srRef = `A${String(idx + 1).padStart(3, '0')}`;
      const trackArtists = song.artistCredits?.length
        ? song.artistCredits
        : release.artistCredits || [];
      const trackContribs = song.contributorCredits?.length
        ? song.contributorCredits
        : release.contributorCredits || [];

      const artistXml = (trackArtists as any[]).map((a: any, i: number) => `
        <Artist>
          <PartyReference>P${String(i + 1).padStart(3,'0')}_${srRef}</PartyReference>
          <ArtistRole>${this.artistRoleDdex(a.role)}</ArtistRole>
          <SequenceNumber>${a.sequenceNo || i + 1}</SequenceNumber>
        </Artist>`).join('');

      const contribXml = (trackContribs as any[]).map((c: any, i: number) => `
        <Contributor>
          <PartyReference>C${String(i + 1).padStart(3,'0')}_${srRef}</PartyReference>
          <ContributorRole>${this.contributorRoleDdex(c.role)}</ContributorRole>
          ${c.sequenceNo ? `<SequenceNumber>${c.sequenceNo}</SequenceNumber>` : ''}
        </Contributor>`).join('');

      const publishingXml = (song.publishingShares as any[] || []).map((p: any) => `
        <RightShare>
          <RightShareType>${p.type === 'songwriter' ? 'OriginalCopyrightHolder' : 'Publisher'}</RightShareType>
          <RightSharePercentage>${p.sharePercent}</RightSharePercentage>
          <PartyName><FullName>${this.esc(p.name)}</FullName></PartyName>
          ${p.ipiNumber ? `<IPINameNumber>${p.ipiNumber}</IPINameNumber>` : ''}
        </RightShare>`).join('');

      return `
    <SoundRecording>
      <SoundRecordingType>MusicalWorkSoundRecording</SoundRecordingType>
      <SoundRecordingId>
        ${song.isrc ? `<ISRC>${this.esc(song.isrc)}</ISRC>` : `<ProprietaryId Namespace="DPID:${senderDpid}">${this.esc(song.id)}</ProprietaryId>`}
      </SoundRecordingId>
      <ResourceReference>${srRef}</ResourceReference>
      <ReferenceTitle>
        <TitleText>${this.esc(song.title)}</TitleText>
        ${song.titleVersion ? `<SubTitle>${this.esc(song.titleVersion)}</SubTitle>` : ''}
      </ReferenceTitle>
      <Duration>${this.isoDuration(song.durationSeconds)}</Duration>
      <SoundRecordingDetailsByTerritory>
        <TerritoryCode>Worldwide</TerritoryCode>
        <Title TitleType="FormalTitle">
          <TitleText>${this.esc(song.title)}</TitleText>
          ${song.titleVersion ? `<SubTitle>${this.esc(song.titleVersion)}</SubTitle>` : ''}
        </Title>
        <LanguageOfPerformance>${this.esc(song.language || release.language || 'en')}</LanguageOfPerformance>
        ${artistXml}
        ${contribXml}
        <ParentalWarningType>${release.parentalAdvisory === 'explicit' ? 'Explicit' : release.parentalAdvisory === 'cleaned' ? 'ExplicitContentEdited' : 'NotExplicit'}</ParentalWarningType>
        <TechnicalSoundRecordingDetails>
          <TechnicalResourceDetailsReference>TRD${srRef}</TechnicalResourceDetailsReference>
          ${song.audioFormat ? `<AudioCodecType>${song.audioFormat.toUpperCase()}</AudioCodecType>` : ''}
          ${song.audioSampleRate ? `<SamplingRate>${song.audioSampleRate}</SamplingRate>` : ''}
          ${song.audioBitDepth ? `<BitsPerSample>${song.audioBitDepth}</BitsPerSample>` : ''}
          ${song.audioUrl ? `<File><FileName>${this.esc(song.audioS3Key || song.audioUrl)}</FileName></File>` : ''}
        </TechnicalSoundRecordingDetails>
        ${publishingXml}
      </SoundRecordingDetailsByTerritory>
    </SoundRecording>`;
    }).join('');

    const imageResource = release.artworkUrl ? `
    <Image>
      <ImageType>FrontCoverImage</ImageType>
      <ResourceReference>A000</ResourceReference>
      <ImageDetailsByTerritory>
        <TerritoryCode>Worldwide</TerritoryCode>
        <TechnicalImageDetails>
          <TechnicalResourceDetailsReference>TRDIMG001</TechnicalResourceDetailsReference>
          ${release.artworkWidth ? `<ImageWidth>${release.artworkWidth}</ImageWidth>` : ''}
          ${release.artworkHeight ? `<ImageHeight>${release.artworkHeight}</ImageHeight>` : ''}
          <ImageCodecType>JPEG</ImageCodecType>
          <File><FileName>${this.esc(release.artworkS3Key || release.artworkUrl)}</FileName></File>
        </TechnicalImageDetails>
      </ImageDetailsByTerritory>
    </Image>` : '';

    // ── Build ReleaseList ─────────────────────────────────────────────────────
    const trackReleases = songs.map((song, idx) => {
      const srRef = `A${String(idx + 1).padStart(3, '0')}`;
      return `
    <Release>
      <ReleaseId>
        ${song.isrc ? `<ISRC>${this.esc(song.isrc)}</ISRC>` : ''}
        <ProprietaryId Namespace="DPID:${senderDpid}">${this.esc(song.id)}</ProprietaryId>
      </ReleaseId>
      <ReleaseReference>T${String(idx + 1).padStart(3,'0')}</ReleaseReference>
      <ReferenceTitle><TitleText>${this.esc(song.title)}</TitleText></ReferenceTitle>
      <ReleaseType>TrackRelease</ReleaseType>
      <ReleaseResourceReferenceList>
        <ReleaseResourceReference>${srRef}</ReleaseResourceReference>
      </ReleaseResourceReferenceList>
      <TrackRelease>
        <TrackNumber>${song.trackNumber}</TrackNumber>
        <DiscNumber>${song.discNumber || 1}</DiscNumber>
        <ReleaseReference>${releaseRef}</ReleaseReference>
      </TrackRelease>
    </Release>`;
    }).join('');

    // Release-level artist XML
    const releaseArtistXml = (release.artistCredits as any[] || []).map((a: any, i: number) => `
      <DisplayArtist>
        <PartyReference>RA${String(i + 1).padStart(3,'0')}</PartyReference>
        <ArtistRole>${this.artistRoleDdex(a.role)}</ArtistRole>
        <SequenceNumber>${a.sequenceNo || i + 1}</SequenceNumber>
      </DisplayArtist>`).join('');

    const territories = release.territories?.includes('worldwide')
      ? '<TerritoryCode>Worldwide</TerritoryCode>'
      : (release.territories || []).map(t => `<TerritoryCode>${t}</TerritoryCode>`).join('');

    const mainRelease = `
    <Release>
      <ReleaseId>
        ${release.upc ? `<UPC>${release.upc}</UPC>` : ''}
        <ProprietaryId Namespace="DPID:${senderDpid}">${release.id}</ProprietaryId>
      </ReleaseId>
      <ReleaseReference>${releaseRef}</ReleaseReference>
      <ReferenceTitle><TitleText>${this.esc(release.title)}</TitleText></ReferenceTitle>
      <ReleaseType>${releaseType[release.type] || 'Album'}</ReleaseType>
      <ReleaseDate>${this.ddexDate(release.releaseDate)}</ReleaseDate>
      ${release.originalReleaseDate ? `<OriginalReleaseDate>${this.ddexDate(release.originalReleaseDate)}</OriginalReleaseDate>` : ''}
      <ReleaseDetailsByTerritory>
        ${territories}
        <DisplayArtistName>${this.esc(primaryArtistName)}</DisplayArtistName>
        ${releaseArtistXml}
        <LabelName>${this.esc(release.labelName || 'MREC Entertainment')}</LabelName>
        <Genre>
          <GenreText>${this.esc(release.genre)}</GenreText>
          ${release.subgenre ? `<SubGenre>${this.esc(release.subgenre)}</SubGenre>` : ''}
        </Genre>
        <ParentalWarningType>${release.parentalAdvisory === 'explicit' ? 'Explicit' : 'NotExplicit'}</ParentalWarningType>
        ${release.artworkUrl ? `<CoverImage><ImageReference>A000</ImageReference></CoverImage>` : ''}
        <TrackList>
          ${songs.map((s, i) => `<TrackRelease><ReleaseReference>T${String(i+1).padStart(3,'0')}</ReleaseReference></TrackRelease>`).join('')}
        </TrackList>
      </ReleaseDetailsByTerritory>
      <ReleaseResourceReferenceList>
        ${songs.map((_, i) => `<ReleaseResourceReference>A${String(i+1).padStart(3,'0')}</ReleaseResourceReference>`).join('')}
        ${release.artworkUrl ? '<ReleaseResourceReference>A000</ReleaseResourceReference>' : ''}
      </ReleaseResourceReferenceList>
    </Release>`;

    // ── DealList ──────────────────────────────────────────────────────────────
    const platforms = release.distributionPlatforms || [];
    const dealXml = `
    <ReleaseDeal>
      <DealReleaseReference>${releaseRef}</DealReleaseReference>
      <Deal>
        <DealTerms>
          <CommercialModelType>SubscriptionModel AsPerAgreement</CommercialModelType>
          <Usage>
            <UseType>OnDemandStream</UseType>
            <UseType>PermanentDownload</UseType>
          </Usage>
          ${territories}
          <ValidityPeriod>
            <StartDate>${this.ddexDate(release.releaseDate)}</StartDate>
          </ValidityPeriod>
        </DealTerms>
      </Deal>
    </ReleaseDeal>`;

    // ── Assemble full XML ─────────────────────────────────────────────────────
    return `<?xml version="1.0" encoding="UTF-8"?>
<NewReleaseMessage
  xmlns="http://ddex.net/xml/ern/43"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://ddex.net/xml/ern/43 http://ddex.net/xml/ern/43/release-notification.xsd"
  MessageSchemaVersionId="ern/43"
  LanguageAndScriptCode="en">

  <MessageHeader>
    <MessageThreadId>${messageId}</MessageThreadId>
    <MessageId>${messageId}</MessageId>
    <MessageSender>
      <PartyId>${senderDpid}</PartyId>
      <PartyName><FullName>${this.esc(senderName)}</FullName></PartyName>
    </MessageSender>
    <SentOnBehalfOf>
      <PartyName><FullName>${this.esc(release.user?.email || 'Unknown')}</FullName></PartyName>
    </SentOnBehalfOf>
    <MessageRecipient>
      <PartyId>PADPIDA2014120901I</PartyId>
      <PartyName><FullName>DSP</FullName></PartyName>
    </MessageRecipient>
    <MessageCreatedDateTime>${now}</MessageCreatedDateTime>
    <MessageControlType>LiveMessage</MessageControlType>
  </MessageHeader>

  <UpdateIndicator>OriginalMessage</UpdateIndicator>

  <ResourceList>
    ${soundRecordings}
    ${imageResource}
  </ResourceList>

  <ReleaseList>
    ${mainRelease}
    ${trackReleases}
  </ReleaseList>

  <DealList>
    ${dealXml}
  </DealList>

</NewReleaseMessage>`;
  }

  // ── Purge / Takedown ─────────────────────────────────────────────────────────

  async generatePurgeReleaseMessage(releaseId: string, senderDpid = 'PADPIDA2024010101O', senderName = 'MREC Entertainment'): Promise<string> {
    const release = await this.releaseRepo.findOne({ where: { id: releaseId } });
    if (!release) throw new NotFoundException('Release not found');
    const messageId = `${senderDpid}_PURGE_${Date.now()}`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<PurgeReleaseMessage
  xmlns="http://ddex.net/xml/ern/43"
  MessageSchemaVersionId="ern/43">
  <MessageHeader>
    <MessageId>${messageId}</MessageId>
    <MessageSender><PartyId>${senderDpid}</PartyId><PartyName><FullName>${this.esc(senderName)}</FullName></PartyName></MessageSender>
    <MessageCreatedDateTime>${new Date().toISOString()}</MessageCreatedDateTime>
    <MessageControlType>LiveMessage</MessageControlType>
  </MessageHeader>
  <PurgeReleaseReference>
    <ReleaseId>${release.upc ? `<UPC>${release.upc}</UPC>` : `<ProprietaryId Namespace="DPID:${senderDpid}">${release.id}</ProprietaryId>`}</ReleaseId>
  </PurgeReleaseReference>
</PurgeReleaseMessage>`;
  }

  // ── Validation ────────────────────────────────────────────────────────────

  async validateForDdex(releaseId: string): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const release = await this.releaseRepo.findOne({
      where: { id: releaseId },
      relations: ['songs'],
    });
    if (!release) throw new NotFoundException('Release not found');

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!release.title) errors.push('Release title is required');
    if (!release.genre) errors.push('Genre is required');
    if (!release.artworkUrl) errors.push('Cover artwork is required');
    if (!release.releaseDate) errors.push('Release date is required');
    if (!release.distributionPlatforms?.length) errors.push('At least one distribution platform is required');
    if (!release.artistCredits?.length) errors.push('At least one artist credit is required');

    const hasPrimary = (release.artistCredits as any[]).some((a: any) => a.role === 'primary_artist');
    if (!hasPrimary) errors.push('A Primary Artist is required');

    const songs = release.songs || [];
    if (songs.length === 0) errors.push('No tracks attached to this release');

    songs.forEach((s, i) => {
      if (!s.title) errors.push(`Track ${i + 1}: title is missing`);
      if (!s.audioUrl) errors.push(`Track ${i + 1} "${s.title}": audio file is missing`);
      if (!s.isrc) warnings.push(`Track ${i + 1} "${s.title}": no ISRC (will be auto-generated)`);
      if (!s.durationSeconds) warnings.push(`Track ${i + 1} "${s.title}": duration unknown`);
    });

    if (!release.upc) warnings.push('No UPC — will be auto-assigned if not provided');
    if (!release.language) warnings.push('No language specified — defaulting to English');
    if (release.artworkWidth && release.artworkWidth < 3000) warnings.push(`Artwork resolution ${release.artworkWidth}×${release.artworkHeight} may be rejected by some DSPs (min 3000×3000)`);

    // Publishing share validation
    const sw = (release.publishingShares as any[] || []).filter((p: any) => p.type === 'songwriter');
    if (sw.length > 0) {
      const total = sw.reduce((s: number, p: any) => s + p.sharePercent, 0);
      if (Math.abs(total - 100) >= 0.01) errors.push(`Songwriter shares total ${total.toFixed(1)}% — must equal 100%`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
