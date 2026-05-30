package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhPayChgHistRepository;
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
public class OdhPayChgHistService {

    private final OdhPayChgHistRepository odhPayChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 결제 변경 이력 키조회 */
    public OdhPayChgHistDto.Item getById(String id) {
        OdhPayChgHistDto.Item dto = odhPayChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhPayChgHistDto.Item getByIdOrNull(String id) {
        return odhPayChgHistRepository.selectById(id).orElse(null);
    }

    /* 결제 변경 이력 상세조회 */
    public OdhPayChgHist findById(String id) {
        return odhPayChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhPayChgHist findByIdOrNull(String id) {
        return odhPayChgHistRepository.findById(id).orElse(null);
    }

    /* 결제 변경 이력 키검증 */
    public boolean existsById(String id) {
        return odhPayChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhPayChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 결제 변경 이력 목록조회 */
    public List<OdhPayChgHistDto.Item> getList(OdhPayChgHistDto.Request req) {
        return odhPayChgHistRepository.selectList(req);
    }

    /* 결제 변경 이력 페이지조회 */
    public OdhPayChgHistDto.PageResponse getPageData(OdhPayChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhPayChgHistRepository.selectPageList(req);
    }

    /* 결제 변경 이력 등록 */
    @Transactional
    public OdhPayChgHist create(OdhPayChgHist body) {
        body.setPayChgHistId(CmUtil.generateId("odh_pay_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhPayChgHist saved = odhPayChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 결제 변경 이력 수정 */
    @Transactional
    public OdhPayChgHist update(String id, OdhPayChgHist body) {
        CmUtil.requireId(id, "id", this);
        OdhPayChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "payChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhPayChgHist saved = odhPayChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 결제 변경 이력 수정 */
    @Transactional
    public OdhPayChgHist updateSelective(OdhPayChgHist entity) {
        if (entity.getPayChgHistId() == null) throw new CmBizException("payChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPayChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPayChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhPayChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 결제 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdhPayChgHist entity = findById(id);
        odhPayChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdhPayChgHist save(String cmd, OdhPayChgHist entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getPayChgHistId() == null || entity.getPayChgHistId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getPayChgHistId() == null)
                    throw new CmBizException("삭제 대상 payChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!odhPayChgHistRepository.existsById(entity.getPayChgHistId()))
                    throw new CmBizException("존재하지 않는 OdhPayChgHist입니다: " + entity.getPayChgHistId() + "::" + CmUtil.svcCallerInfo(this));
                odhPayChgHistRepository.deleteById(entity.getPayChgHistId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setPayChgHistId(CmUtil.generateId("odh_pay_chg_hist"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                OdhPayChgHist saved = odhPayChgHistRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getPayChgHistId() == null)
                    throw new CmBizException("수정 대상 payChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = odhPayChgHistRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 OdhPayChgHist입니다: " + entity.getPayChgHistId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getPayChgHistId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<OdhPayChgHist> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (OdhPayChgHist row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getPayChgHistId() == null || row.getPayChgHistId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, OdhPayChgHist::getPayChgHistId, "U", "payChgHistId", this);
            CmUtil.requireRowIds(rows, OdhPayChgHist::getPayChgHistId, "D", "payChgHistId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(OdhPayChgHist::getPayChgHistId)
                .toList();
            if (!deleteIds.isEmpty()) {
                odhPayChgHistRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<OdhPayChgHist> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (OdhPayChgHist row : updateRows) {
                row.setUpdBy(authId);
                int affected = odhPayChgHistRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getPayChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<OdhPayChgHist> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (OdhPayChgHist row : insertRows) {
                row.setPayChgHistId(CmUtil.generateId("odh_pay_chg_hist"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odhPayChgHistRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
