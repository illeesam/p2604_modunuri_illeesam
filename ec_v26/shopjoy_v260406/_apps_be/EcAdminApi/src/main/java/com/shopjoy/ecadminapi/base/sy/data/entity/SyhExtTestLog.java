package com.shopjoy.ecadminapi.base.sy.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "syh_ext_test_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("외부 연동 테스트 이력")
public class SyhExtTestLog extends BaseEntity {

    @Id
    @Column(name = "log_id", length = 40)
    @Comment("로그ID")
    private String logId;

    @Column(name = "site_id", length = 20, nullable = false)
    @Comment("사이트ID")
    private String siteId;

    @Column(name = "channel_key", length = 60, nullable = false)
    @Comment("채널키 (smtp/fcm/sms/ai 등)")
    private String channelKey;

    @Column(name = "channel_label", length = 100)
    @Comment("채널 표시명")
    private String channelLabel;

    @Column(name = "test_result", length = 10, nullable = false)
    @Comment("테스트결과 (SUCCESS/FAIL)")
    private String testResult;

    @Column(name = "test_msg", length = 2000)
    @Comment("결과 메시지 (응답 내용)")
    private String testMsg;

    @Column(name = "test_url", length = 500)
    @Comment("테스트 호출 URL")
    private String testUrl;

    @Column(name = "test_req_body", length = 2000)
    @Comment("테스트 요청 내용 (JSON)")
    private String testReqBody;

    @Column(name = "test_account", length = 200)
    @Comment("테스트 계정 정보 (수신자/대상)")
    private String testAccount;
}
