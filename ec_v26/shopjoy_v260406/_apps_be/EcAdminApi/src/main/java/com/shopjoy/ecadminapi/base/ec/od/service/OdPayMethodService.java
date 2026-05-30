package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdPayMethodRepository;
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
public class OdPayMethodService {

    private final OdPayMethodRepository odPayMethodRepository;

    @PersistenceContext
    private EntityManager em;

    /* 결제수단 키조회 */
    public OdPayMethodDto.Item getById(String id) {
        OdPayMethodDto.Item dto = odPayMethodRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdPayMethodDto.Item getByIdOrNull(String id) {
        return odPayMethodRepository.selectById(id).orElse(null);
    }

    /* 결제수단 상세조회 */
    public OdPayMethod findById(String id) {
        return odPayMethodRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdPayMethod findByIdOrNull(String id) {
        return odPayMethodRepository.findById(id).orElse(null);
    }

    /* 결제수단 키검증 */
    public boolean existsById(String id) {
        return odPayMethodRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odPayMethodRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 결제수단 목록조회 */
    public List<OdPayMethodDto.Item> getList(OdPayMethodDto.Request req) {
        return odPayMethodRepository.selectList(req);
    }

    /* 결제수단 페이지조회 */
    public OdPayMethodDto.PageResponse getPageData(OdPayMethodDto.Request req) {
        PageHelper.addPaging(req);
        return odPayMethodRepository.selectPageList(req);
    }

    /* 결제수단 등록 */
    @Transactional
    public OdPayMethod create(OdPayMethod body) {
        body.setPayMethodId(CmUtil.generateId("od_pay_method"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdPayMethod saved = odPayMethodRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 결제수단 수정 */
    @Transactional
    public OdPayMethod update(String id, OdPayMethod body) {
        CmUtil.requireId(id, "id", this);
        OdPayMethod entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "payMethodId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPayMethod saved = odPayMethodRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 결제수단 수정 */
    @Transactional
    public OdPayMethod updateSelective(OdPayMethod entity) {
        if (entity.getPayMethodId() == null) throw new CmBizException("payMethodId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPayMethodId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPayMethodId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odPayMethodRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 결제수단 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdPayMethod entity = findById(id);
        odPayMethodRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdPayMethod save(String cmd, OdPayMethod entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getPayMethodId() == null || entity.getPayMethodId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getPayMethodId() == null)
                    throw new CmBizException("삭제 대상 payMethodId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!odPayMethodRepository.existsById(entity.getPayMethodId()))
                    throw new CmBizException("존재하지 않는 OdPayMethod입니다: " + entity.getPayMethodId() + "::" + CmUtil.svcCallerInfo(this));
                odPayMethodRepository.deleteById(entity.getPayMethodId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setPayMethodId(CmUtil.generateId("od_pay_method"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                OdPayMethod saved = odPayMethodRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getPayMethodId() == null)
                    throw new CmBizException("수정 대상 payMethodId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = odPayMethodRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 OdPayMethod입니다: " + entity.getPayMethodId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getPayMethodId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<OdPayMethod> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (OdPayMethod row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getPayMethodId() == null || row.getPayMethodId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, OdPayMethod::getPayMethodId, "U", "payMethodId", this);
            CmUtil.requireRowIds(rows, OdPayMethod::getPayMethodId, "D", "payMethodId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(OdPayMethod::getPayMethodId)
                .toList();
            if (!deleteIds.isEmpty()) {
                odPayMethodRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<OdPayMethod> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (OdPayMethod row : updateRows) {
                row.setUpdBy(authId);
                int affected = odPayMethodRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getPayMethodId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<OdPayMethod> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (OdPayMethod row : insertRows) {
                row.setPayMethodId(CmUtil.generateId("od_pay_method"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odPayMethodRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
