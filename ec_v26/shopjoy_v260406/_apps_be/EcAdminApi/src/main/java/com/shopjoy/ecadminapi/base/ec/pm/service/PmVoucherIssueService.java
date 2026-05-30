package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmVoucherIssueRepository;
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
public class PmVoucherIssueService {

    private final PmVoucherIssueRepository pmVoucherIssueRepository;

    @PersistenceContext
    private EntityManager em;

    /* 바우처(상품권) 발행 이력 키조회 */
    public PmVoucherIssueDto.Item getById(String id) {
        PmVoucherIssueDto.Item dto = pmVoucherIssueRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmVoucherIssueDto.Item getByIdOrNull(String id) {
        return pmVoucherIssueRepository.selectById(id).orElse(null);
    }

    /* 바우처(상품권) 발행 이력 상세조회 */
    public PmVoucherIssue findById(String id) {
        return pmVoucherIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmVoucherIssue findByIdOrNull(String id) {
        return pmVoucherIssueRepository.findById(id).orElse(null);
    }

    /* 바우처(상품권) 발행 이력 키검증 */
    public boolean existsById(String id) {
        return pmVoucherIssueRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmVoucherIssueRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 바우처(상품권) 발행 이력 목록조회 */
    public List<PmVoucherIssueDto.Item> getList(PmVoucherIssueDto.Request req) {
        return pmVoucherIssueRepository.selectList(req);
    }

    /* 바우처(상품권) 발행 이력 페이지조회 */
    public PmVoucherIssueDto.PageResponse getPageData(PmVoucherIssueDto.Request req) {
        PageHelper.addPaging(req);
        return pmVoucherIssueRepository.selectPageList(req);
    }

    /* 바우처(상품권) 발행 이력 등록 */
    @Transactional
    public PmVoucherIssue create(PmVoucherIssue body) {
        body.setVoucherIssueId(CmUtil.generateId("pm_voucher_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmVoucherIssue saved = pmVoucherIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 바우처(상품권) 발행 이력 수정 */
    @Transactional
    public PmVoucherIssue update(String id, PmVoucherIssue body) {
        CmUtil.requireId(id, "id", this);
        PmVoucherIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "voucherIssueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucherIssue saved = pmVoucherIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 바우처(상품권) 발행 이력 수정 */
    @Transactional
    public PmVoucherIssue updateSelective(PmVoucherIssue entity) {
        if (entity.getVoucherIssueId() == null) throw new CmBizException("voucherIssueId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVoucherIssueId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVoucherIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmVoucherIssueRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 바우처(상품권) 발행 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmVoucherIssue entity = findById(id);
        pmVoucherIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmVoucherIssue save(String cmd, PmVoucherIssue entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getVoucherIssueId() == null || entity.getVoucherIssueId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getVoucherIssueId() == null)
                    throw new CmBizException("삭제 대상 voucherIssueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pmVoucherIssueRepository.existsById(entity.getVoucherIssueId()))
                    throw new CmBizException("존재하지 않는 PmVoucherIssue입니다: " + entity.getVoucherIssueId() + "::" + CmUtil.svcCallerInfo(this));
                pmVoucherIssueRepository.deleteById(entity.getVoucherIssueId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setVoucherIssueId(CmUtil.generateId("pm_voucher_issue"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PmVoucherIssue saved = pmVoucherIssueRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getVoucherIssueId() == null)
                    throw new CmBizException("수정 대상 voucherIssueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pmVoucherIssueRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PmVoucherIssue입니다: " + entity.getVoucherIssueId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getVoucherIssueId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PmVoucherIssue> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PmVoucherIssue row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getVoucherIssueId() == null || row.getVoucherIssueId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PmVoucherIssue::getVoucherIssueId, "U", "voucherIssueId", this);
            CmUtil.requireRowIds(rows, PmVoucherIssue::getVoucherIssueId, "D", "voucherIssueId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PmVoucherIssue::getVoucherIssueId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pmVoucherIssueRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PmVoucherIssue> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PmVoucherIssue row : updateRows) {
                row.setUpdBy(authId);
                int affected = pmVoucherIssueRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getVoucherIssueId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PmVoucherIssue> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PmVoucherIssue row : insertRows) {
                row.setVoucherIssueId(CmUtil.generateId("pm_voucher_issue"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmVoucherIssueRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
