#ifndef WINDOW_H
#define WINDOW_H

#include <stdint.h>

typedef struct window_config_t {
  const char* title;
  uint32_t width;
  uint32_t height;
  int resizable;
} window_config_t;

typedef struct window window_t;
typedef struct {
  void (*scroll_callback)(window_t* window, int ctrl_key, int shift_key,
                          float mouse_x, float mouse_y, float wheel_delta_y);
  void (*resize_callback)(window_t* window, int width, int height);
} callbacks_t;

/* window related functions */
window_t* window_create(window_config_t* config);
void window_destroy(window_t* window);
int window_should_close(window_t* window);
void window_set_title(window_t* window, const char* title);
void window_set_userdata(window_t* window, void* userdata);
void* window_get_userdata(window_t* window);
void* window_get_surface(window_t* window);
void window_get_size(window_t* window, uint32_t* width, uint32_t* height);
void window_get_aspect_ratio(window_t* window, float* aspect_ratio);

#endif
