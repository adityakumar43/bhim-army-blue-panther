
export function cdn(url, width) {
  return url && url.includes('/upload/') ? url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`) : url
}



// A face-focused portrait (3:4) at the given width
export function portrait(url, width) {
  return url && url.includes('/upload/')
    ? url.replace('/upload/', `/upload/c_fill,g_face,w_${width},h_${Math.round((width * 4) / 3)},f_auto,q_auto/`)
    : url
}
