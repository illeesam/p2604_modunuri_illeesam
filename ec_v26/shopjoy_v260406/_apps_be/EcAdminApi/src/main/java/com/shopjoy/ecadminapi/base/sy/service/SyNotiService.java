package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyNotiDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNoti;
import com.shopjoy.ecadminapi.base.sy.repository.SyNotiRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 알림함(sy_noti) 서비스 — 수신자별 알림 1건 = 1행.
 * BO(사용자)·FO(회원) 양쪽이 같은 테이블을 쓰고, recvTypeCd 로 구분한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyNotiService {

    private final SyNotiRepository syNotiRepository;

    @PersistenceContext
    private EntityManager em;

    /* 알림함 키조회 */
    public SyNotiDto.Item getById(String id) {
        SyNotiDto.Item dto = syNotiRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public SyNotiDto.Item getByIdOrNull(String id) {
        return syNotiRepository.selectById(id).orElse(null);
    }

    public SyNoti findById(String id) {
        return syNotiRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public boolean existsById(String id) {
        return syNotiRepository.existsById(id);
    }

    /* 알림함 목록조회 */
    public List<SyNotiDto.Item> getList(SyNotiDto.Request req) {
        return syNotiRepository.selectList(req);
    }

    /* 알림함 페이지조회 */
    public BasePage<SyNotiDto.Item> getPageData(SyNotiDto.Request req) {
        PageHelper.addPaging(req);
        return syNotiRepository.selectPageData(req);
    }

    /* 안읽음 건수 — 종 아이콘 뱃지 */
    public long countUnread(String recvTypeCd, String recvId) {
        CmUtil.requireId(recvId, "recvId", this);
        return syNotiRepository.countUnread(recvTypeCd, recvId);
    }

    /* 알림함 등록 */
    @Transactional
    public SyNoti create(SyNoti body) {
        body.setNotiId(CmUtil.generateId("sy_noti"));
        if (body.getReadYn() == null) body.setReadYn("N");
        if (body.getNotiTypeCd() == null) body.setNotiTypeCd("ALARM");
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyNoti saved = syNotiRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /**
     * 발송 — 수신자 여러 명에게 같은 알림을 한 번에 적재.
     * 수신자 1명 = sy_noti 1행 (각자 읽음 상태를 따로 관리해야 하므로 공유 행을 두지 않는다).
     */
    @Transactional
    public List<SyNoti> send(SyNotiDto.SendReq req) {
        if (req == null || req.getRecvList() == null || req.getRecvList().isEmpty()) {
            throw new CmBizException("수신자가 지정되지 않았습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        if (req.getNotiTitle() == null || req.getNotiTitle().isBlank()) {
            throw new CmBizException("알림 제목은 필수입니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<SyNoti> rows = new ArrayList<>();
        for (SyNotiDto.Recv r : req.getRecvList()) {
            if (r == null || r.getRecvId() == null || r.getRecvId().isBlank()) continue;
            SyNoti e = new SyNoti();
            e.setNotiId(CmUtil.generateId("sy_noti"));
            e.setRecvTypeCd(r.getRecvTypeCd() == null ? "MEMBER" : r.getRecvTypeCd());
            e.setRecvId(r.getRecvId());
            e.setRecvNm(r.getRecvNm());
            e.setNotiTypeCd(req.getNotiTypeCd() == null ? "ALARM" : req.getNotiTypeCd());
            e.setChannelCd(req.getChannelCd());
            e.setNotiTitle(req.getNotiTitle());
            e.setNotiContent(req.getNotiContent());
            e.setLinkPage(req.getLinkPage());
            e.setRefId(req.getRefId());
            e.setReadYn("N");
            e.setRegBy(authId);  e.setRegDate(now);
            e.setUpdBy(authId);  e.setUpdDate(now);
            rows.add(e);
        }
        if (rows.isEmpty()) {
            throw new CmBizException("유효한 수신자가 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        List<SyNoti> saved = syNotiRepository.saveAll(rows);
        em.flush();
        return saved;
    }

    /* 알림함 수정 — QueryDSL updateSelective 로 넘어온 필드만 SET (전체 fetch+save 대신) */
    @Transactional
    public SyNoti update(String id, SyNoti body) {
        CmUtil.requireId(id, "id", this);
        body.setNotiId(id);
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        int affected = syNotiRepository.updateSelective(body);
        if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return findById(id);
    }

    /** 읽음 처리 — 본인 알림인지 확인 후 갱신 (다른 사람 알림을 읽음 처리할 수 없다) */
    @Transactional
    public SyNoti markRead(String id, String readYn, String recvTypeCd, String recvId) {
        CmUtil.requireId(id, "id", this);
        SyNoti entity = findById(id);
        if (recvId != null && !recvId.equals(entity.getRecvId())) {
            throw new CmBizException("접근 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        if (recvTypeCd != null && !recvTypeCd.equals(entity.getRecvTypeCd())) {
            throw new CmBizException("접근 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        boolean read = !"N".equals(readYn);
        entity.setReadYn(read ? "Y" : "N");
        entity.setReadDate(read ? LocalDateTime.now() : null);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyNoti saved = syNotiRepository.save(entity);
        em.flush();
        return saved;
    }

    /* 모두읽음 */
    @Transactional
    public int markAllRead(String recvTypeCd, String recvId) {
        CmUtil.requireId(recvId, "recvId", this);
        int n = syNotiRepository.markAllRead(recvTypeCd, recvId);
        em.flush(); em.clear();
        return n;
    }

    /* 알림함 삭제 — 본인 알림만 */
    @Transactional
    public void delete(String id, String recvTypeCd, String recvId) {
        CmUtil.requireId(id, "id", this);
        SyNoti entity = findById(id);
        if (recvId != null && !recvId.equals(entity.getRecvId())) {
            throw new CmBizException("접근 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        if (recvTypeCd != null && !recvTypeCd.equals(entity.getRecvTypeCd())) {
            throw new CmBizException("접근 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        syNotiRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 전체삭제 — 수신자 본인 알림 전부 */
    @Transactional
    public int deleteAllOf(String recvTypeCd, String recvId) {
        CmUtil.requireId(recvId, "recvId", this);
        int n = syNotiRepository.deleteAllOf(recvTypeCd, recvId);
        em.flush(); em.clear();
        return n;
    }
}
