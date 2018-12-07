// https://developers.google.com/photos/library/reference/rest/

export namespace photos {
export interface SharedAlbumOptions {
  isCollaborative: boolean;
  isCommentable: boolean;
}
export interface ShareInfo {
  sharedAlbumOptions: SharedAlbumOptions;
  shareableUrl: string;
  shareToken: string;
  isJoined: boolean;
}
export interface Album {
  id: string;
  title: string;
  productUrl: string;
  isWriteable: boolean;
  shareInfo: ShareInfo;
  mediaItemsCount: string;
  coverPhotoBaseUrl: string;
  coverPhotoMediaItemId: string;
}
export interface MediaMetadata {}
export interface ContributorInfo {}
export interface MediaItem {
  id: string;
  description: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  mediaMetadata: MediaMetadata;
  contributorInfo: ContributorInfo;
  filename: string;
}
}
