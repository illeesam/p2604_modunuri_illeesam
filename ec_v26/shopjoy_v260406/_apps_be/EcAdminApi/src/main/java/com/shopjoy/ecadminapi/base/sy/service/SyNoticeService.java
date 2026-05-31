package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.repository.SyNoticeRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyNoticeService {

    private final SyNoticeRepository syNoticeRepository;

    @PersistenceContext
    private EntityManager em;

    /* 공지사항 키조회 */
    public SyNoticeDto.Item getById(String id) {
        SyNoticeDto.Item dto = syNoticeRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyNoticeDto.Item getByIdOrNull(String id) {
        return syNoticeRepository.selectById(id).orElse(null);
    }

    /* 공지사항 상세조회 */
    public SyNotice findById(String id) {
        return syNoticeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyNotice findByIdOrNull(String id) {
        return syNoticeRepository.findById(id).orElse(null);
    }

    /* 공지사항 키검증 */
    public boolean existsById(String id) {
        return syNoticeRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syNoticeRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 공지사항 목록조회 */
    public List<SyNoticeDto.Item> getList(SyNoticeDto.Request req) {
        return syNoticeRepository.selectList(req);
    }

    /* 공지사항 페이지조회 */
    public SyNoticeDto.PageResponse getPageData(SyNoticeDto.Request req) {
        PageHelper.addPaging(req);
        return syNoticeRepository.selectPageData(req);
    }

    /* 공지사항 등록 */
    @Transactional
    public SyNotice create(SyNotice body) {
        body.setNoticeId(CmUtil.generateId("sy_notice"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyNotice saved = syNoticeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 공지사항 수정 */
    @Transactional
    public SyNotice update(String id, SyNotice body) {
        CmUtil.requireId(id, "id", this);
        SyNotice entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "noticeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyNotice saved = syNoticeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 공지사항 수정 */
    @Transactional
    public SyNotice updateSelective(SyNotice entity) {
        if (entity.getNoticeId() == null) throw new CmBizException("noticeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getNoticeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getNoticeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syNoticeRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 공지사항 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyNotice entity = findById(id);
        syNoticeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyNotice save(String cmd, SyNotice entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getNoticeId() == null || entity.getNoticeId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getNoticeId() == null)
                    throw new CmBizException("삭제 대상 noticeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syNoticeRepository.existsById(entity.getNoticeId()))
                    throw new CmBizException("존재하지 않는 SyNotice입니다: " + entity.getNoticeId() + "::" + CmUtil.svcCallerInfo(this));
                syNoticeRepository.deleteById(entity.getNoticeId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setNoticeId(CmUtil.generateId("sy_notice"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyNotice saved = syNoticeRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getNoticeId() == null)
                    throw new CmBizException("수정 대상 noticeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syNoticeRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyNotice입니다: " + entity.getNoticeId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getNoticeId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyNotice> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyNotice row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getNoticeId() == null || row.getNoticeId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyNotice::getNoticeId, "U", "noticeId", this);
            CmUtil.requireRowIds(rows, SyNotice::getNoticeId, "D", "noticeId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyNotice::getNoticeId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syNoticeRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyNotice> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyNotice row : updateRows) {
                row.setUpdBy(authId);
                int affected = syNoticeRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getNoticeId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyNotice> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyNotice row : insertRows) {
                row.setNoticeId(CmUtil.generateId("sy_notice"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syNoticeRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
