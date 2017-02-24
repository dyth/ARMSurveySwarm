#include "mbed.h"
#include "m3pi.h"
 
m3pi m3pi;
 
// Minimum and maximum motor speeds
#define MAX 1.0
#define MIN 0
 
// PID terms
#define P_TERM 1
#define I_TERM 0
#define D_TERM 20
 
int main() {
 
    m3pi.locate(0,1);
    m3pi.printf("Line PID");
 
    wait(0.5);
 
    m3pi.sensor_auto_calibrate();
 
    float right;
    float left;
    float current_pos_of_line = 0.0;
    float previous_pos_of_line = 0.0;
    float derivative,proportional,integral = 0;
    float power;
    float speed = MAX;
    
    int count = 0;
     
    while (1) {
        count++;
 
        // Get the position of the line.
        current_pos_of_line = m3pi.line_position();        
        proportional = current_pos_of_line;
        
        // Compute the derivative
        derivative = current_pos_of_line - previous_pos_of_line;
        
        // Compute the integral
        integral += proportional;
        
        // Remember the last position.
        previous_pos_of_line = current_pos_of_line;
        
        // Compute the power
        power = (proportional * (P_TERM) ) + (integral*(I_TERM)) + (derivative*(D_TERM)) ;
        
        // Compute new speeds   
        right = speed+power;
        left  = speed-power;
        
        // limit checks
        if (right < MIN) {
            right = MIN;
        } else if (right > MAX) {
            right = MAX;
        }
            
        if (left < MIN) {
            left = MIN;
        } else if (left > MAX) {
            left = MAX;
        }
        
        if (count > 10 && left < 0.05 && right == MAX) {
            break;
        }
        
        // set speed 
        m3pi.left_motor(left);
        m3pi.right_motor(right);
 
    }
    m3pi.stop();
}
