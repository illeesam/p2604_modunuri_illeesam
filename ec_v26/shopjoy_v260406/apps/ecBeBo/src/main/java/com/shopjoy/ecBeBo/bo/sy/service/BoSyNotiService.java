package com.shopjoy.ecBeBo.bo.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyNotiDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyNoti;
import com.shopjoy.ecBeBo.base.sy.service.SyNotiService;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 알림함 서비스 — 관리자 사용자(recvTypeCd='USER') 기준으로 스코프를 강제한다.
 * "내 알림" 조회·읽음·삭제는 로그인 사용자 ID 를 서버에서 주입해 다른 사람 알림에 접근할 수 없게 한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyNotiService {

    private static final String RECV_TYPE = "USER";

    private final SyNotiService syNotiService;

    /* 현재 로그인 사용자 ID */
    private String me() { return SecurityUtil.getAuthUser().authId(); }

    /* 내 알림함 페이지조회 (수신자 조건 서버 강제) */
    public BasePage<SyNotiDto.Item> getMyPageData(SyNotiDto.Request req) {
        req.setRecvTypeCd(RECV_TYPE);
        req.setRecvId(me());
        return syNotiService.getPageData(req);
    }

    /* 내 알림함 목록조회 (종 드롭다운용 — pageSize 로 상위 N건) */
    public List<SyNotiDto.Item> getMyList(SyNotiDto.Request req) {
        req.setRecvTypeCd(RECV_TYPE);
        req.setRecvId(me());
        return syNotiService.getList(req);
    }

    /* 내 안읽음 건수 */
    public long getMyUnreadCount() { return syNotiService.countUnread(RECV_TYPE, me()); }

    /* 전체 알림 조회 (관리자 — 수신자 무관) */
    public BasePage<SyNotiDto.Item> getPageData(SyNotiDto.Request req) { return syNotiService.getPageData(req); }
    public SyNotiDto.Item getById(String id) { return syNotiService.getById(id); }

    /* 발송 — 수신자 여러 명에게 적재 */
    @Transactional public List<SyNoti> send(SyNotiDto.SendReq req) { return syNotiService.send(req); }

    @Transactional public SyNoti create(SyNoti body) { return syNotiService.create(body); }
    @Transactional public SyNoti markRead(String id, String readYn) { return syNotiService.markRead(id, readYn, RECV_TYPE, me()); }
    @Transactional public int    markAllRead() { return syNotiService.markAllRead(RECV_TYPE, me()); }
    @Transactional public void   delete(String id) { syNotiService.delete(id, RECV_TYPE, me()); }
    @Transactional public int    deleteMyAll() { return syNotiService.deleteAllOf(RECV_TYPE, me()); }
}
