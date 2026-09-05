package com.shopjoy.ecBeBo.base.sy.data.entity;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "syh_ext_test_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("외부 연동 테스트 이력")
public class SyhExtTestLog extends BaseEntity {

    @Id
    @Column(name = "log_id", length = 40)
    @Comment("로그ID")
    @Size(max = 40, message = "logId 는 40자 이내여야 합니다.")
    private String logId;

    @Column(name = "channel_key", length = 60, nullable = false)
    @Comment("채널키 (smtp/fcm/sms/ai 등)")
    @Size(max = 60, message = "channelKey 는 60자 이내여야 합니다.")
    private String channelKey;

    @Column(name = "channel_label", length = 100)
    @Comment("채널 표시명")
    @Size(max = 100, message = "channelLabel 는 100자 이내여야 합니다.")
    private String channelLabel;

    @Column(name = "test_result_cd", length = 10, nullable = false)
    @Comment("테스트결과 (SUCCESS/FAIL)")
    @Size(max = 10, message = "testResultCd 는 10자 이내여야 합니다.")
    private String testResultCd;

    @Column(name = "test_msg", length = 2000)
    @Comment("결과 메시지 (응답 내용)")
    @Size(max = 2000, message = "testMsg 는 2000자 이내여야 합니다.")
    private String testMsg;

    @Column(name = "test_url", length = 500)
    @Comment("테스트 호출 URL")
    @Size(max = 500, message = "testUrl 는 500자 이내여야 합니다.")
    private String testUrl;

    @Column(name = "test_req_body", length = 2000)
    @Comment("테스트 요청 내용 (JSON)")
    @Size(max = 2000, message = "testReqBody 는 2000자 이내여야 합니다.")
    private String testReqBody;

    @Column(name = "test_account", length = 200)
    @Comment("테스트 계정 정보 (수신자/대상)")
    @Size(max = 200, message = "testAccount 는 200자 이내여야 합니다.")
    private String testAccount;
}
