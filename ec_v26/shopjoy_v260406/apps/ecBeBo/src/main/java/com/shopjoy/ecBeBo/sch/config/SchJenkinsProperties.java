package com.shopjoy.ecadminapi.sch.config;

import lombok.Data;

@Data
public class SchJenkinsProperties {

    private boolean enabled = false;
    private String token = "";
    private String url = "";

    /** hasToken — 존재여부 */
    public boolean hasToken() {
        return token != null && !token.isBlank();
    }

    /** isTokenValid — 여부 */
    public boolean isTokenValid(String incoming) {
        return hasToken() && token.equals(incoming);
    }
}
